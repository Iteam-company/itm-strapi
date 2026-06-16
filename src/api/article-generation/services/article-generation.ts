/**
 * article-generation service
 */

import { factories } from '@strapi/strapi';
import {
  ArticleGenerationConfig,
  ArticleGenerationContext,
  ArticleGenerationProvider,
  GeneratedAiDraft,
  NamedComponent,
} from './article-generation.types';
import { mockArticleGenerationProvider } from './providers/mock-article-generation-provider';
import { openaiArticleGenerationProvider } from './providers/openai-article-generation-provider';

const BLOG_UID = 'api::blog.blog';
const ARTICLE_GENERATION_UID = 'api::article-generation.article-generation';
const UPLOAD_FILE_UID = 'plugin::upload.file';

const extractNames = (items: NamedComponent[] = []) =>
  items.map(({ name }) => name?.trim()).filter(Boolean) as string[];

const extractListItems = (value?: string | null) =>
  (value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const dedupeStrings = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];

const normalizeTag = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);

const extractCategoryTags = (value?: string | null) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const chooseCategoryFocus = (
  allowedTagPool: string[],
  recentCategoryTags: string[],
  preferredCategory: string,
) => {
  const fallbackTag = preferredCategory.split(',')[0]?.trim() || 'AI MVP development';
  const candidateTags = dedupeStrings(allowedTagPool).filter(
    (tag) => !['ai', 'mvp'].includes(normalizeTag(tag)),
  );
  const candidates = candidateTags.length ? candidateTags : [fallbackTag];
  const [lastPrimaryCategory] = recentCategoryTags;
  const recentTagCounts = recentCategoryTags.reduce<Record<string, number>>((acc, tag) => {
    const normalizedTag = normalizeTag(tag);
    acc[normalizedTag] = (acc[normalizedTag] || 0) + 1;
    return acc;
  }, {});

  const [primaryCategoryFocus, secondaryCategoryFocus = null] = [...candidates].sort((a, b) => {
    const scoreTag = (tag: string) => {
      const normalizedTag = normalizeTag(tag);
      const recentUsageScore = recentTagCounts[normalizedTag] || 0;
      const lastPrimaryPenalty = normalizedTag === normalizeTag(lastPrimaryCategory || '') ? 3 : 0;

      return recentUsageScore + lastPrimaryPenalty;
    };

    const usageDelta = scoreTag(a) - scoreTag(b);

    if (usageDelta !== 0) {
      return usageDelta;
    }

    return candidates.indexOf(a) - candidates.indexOf(b);
  });

  return {
    primaryCategoryFocus,
    secondaryCategoryFocus,
  };
};

const chooseSeoKeywordFocus = (seoKeywords: string[], recentTitles: string[]) => {
  const keywords = dedupeStrings(seoKeywords);

  if (!keywords.length) {
    return {
      primarySeoKeyword: null,
      secondarySeoKeywords: [],
    };
  }

  const searchableRecentTitles = normalizeTag(recentTitles.join(' '));
  const [primarySeoKeyword, ...secondarySeoKeywords] = [...keywords].sort((a, b) => {
    const scoreKeyword = (keyword: string) => {
      const normalizedKeyword = normalizeTag(keyword);

      return searchableRecentTitles.includes(normalizedKeyword) ? 1 : 0;
    };

    const usageDelta = scoreKeyword(a) - scoreKeyword(b);

    if (usageDelta !== 0) {
      return usageDelta;
    }

    return keywords.indexOf(a) - keywords.indexOf(b);
  });

  return {
    primarySeoKeyword,
    secondarySeoKeywords: secondarySeoKeywords.slice(0, 3),
  };
};

const toPositiveInteger = (value: unknown, fallback: number, min: number) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(min, Math.round(parsedValue));
};

const getDeterministicIndex = (value: string, size: number) => {
  if (size <= 0) {
    return 0;
  }

  const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return hash % size;
};

const buildUniqueSlug = (baseSlug: string, existingSlugs: string[]) => {
  const fallbackSlug = baseSlug || 'ai-blog-post';
  const existingSlugSet = new Set(existingSlugs);

  if (!existingSlugSet.has(fallbackSlug)) {
    return fallbackSlug;
  }

  for (let index = 2; index < 1000; index += 1) {
    const candidateSlug = `${fallbackSlug}-${index}`;

    if (!existingSlugSet.has(candidateSlug)) {
      return candidateSlug;
    }
  }

  return `${fallbackSlug}-${Date.now()}`;
};

export default factories.createCoreService(
  'api::article-generation.article-generation',
  ({ strapi }) => ({
    async getGenerationConfig(): Promise<ArticleGenerationConfig | null> {
      return strapi.db.query(ARTICLE_GENERATION_UID).findOne({
        populate: ['referenceCategory', 'bannedCetagory', 'exisitigTitles'],
      });
    },

    async getRecentAiPosts(limit = 20): Promise<Array<{ title?: string | null; category?: string | null }>> {
      return strapi.db.query(BLOG_UID).findMany({
        where: {
          blogType: 'ai',
        },
        select: ['title', 'category'],
        orderBy: {
          publishedAt: 'desc',
        },
        limit,
      });
    },

    async getRecentAiTitles(limit = 20): Promise<string[]> {
      const recentAiPosts = await this.getRecentAiPosts(limit);

      return dedupeStrings(
        recentAiPosts.map((post) => post.title).filter((title): title is string => Boolean(title)),
      );
    },

    async getExistingBlogSlugs(): Promise<string[]> {
      const posts = await strapi.db.query(BLOG_UID).findMany({
        select: ['slug'],
        limit: 1000,
      });

      return dedupeStrings(posts.map((post) => post.slug).filter((slug): slug is string => Boolean(slug)));
    },

    getProvider(): ArticleGenerationProvider {
      const providerName = process.env.ARTICLE_GENERATION_PROVIDER || 'mock';

      switch (providerName) {
        case 'mock':
          return mockArticleGenerationProvider;
        case 'openai':
          return openaiArticleGenerationProvider;
        default:
          throw new Error(
            `Unsupported article generation provider "${providerName}". Supported providers: mock, openai.`,
          );
      }
    },

    async buildGenerationContext(requestedTopic?: string | null): Promise<ArticleGenerationContext> {
      const config = await this.getGenerationConfig();
      const referenceCategories = extractNames(config?.referenceCategory);
      const bannedCategories = extractNames(config?.bannedCetagory);
      const existingTitles = extractNames(config?.exisitigTitles);
      const recentAiPosts = await this.getRecentAiPosts();
      const recentAiTitles = dedupeStrings(
        recentAiPosts.map((post) => post.title).filter((title): title is string => Boolean(title)),
      );
      const seoKeywords = extractListItems(config?.seoKeywords);
      const preferredCategory = referenceCategories[0] || 'AI, MVP';
      const defaultCategoryPool = [
        'AI MVP development',
        'startup MVP validation',
        'AI product discovery',
        'software partner for startups',
        'AI delivery risk',
        'MVP scope strategy',
      ];
      const allowedTagPool = dedupeStrings(
        referenceCategories.length ? referenceCategories : defaultCategoryPool,
      ).filter(
        (tag) =>
          !bannedCategories.some((bannedTag) => normalizeTag(bannedTag) === normalizeTag(tag)),
      );
      const recentAiCategories = dedupeStrings(recentAiPosts.flatMap((post) => extractCategoryTags(post.category)));
      const categoryFocus = chooseCategoryFocus(
        allowedTagPool,
        recentAiPosts.flatMap((post) => extractCategoryTags(post.category)),
        preferredCategory,
      );
      const seoKeywordFocus = chooseSeoKeywordFocus(seoKeywords, recentAiTitles);
      const targetAudience =
        config?.targetAudience?.trim() || 'Founders, product owners, and software decision-makers';
      const toneOfVoice =
        config?.toneOfVoice?.trim() || 'Practical, expert, clear, and non-hype';
      const contentGoals = extractListItems(config?.contentGoals);
      const requiredSections = extractListItems(config?.requiredSections);
      const forbiddenPhrases = extractListItems(config?.forbiddenPhrases);
      const editorialNotes = config?.editorialNotes?.trim() || '';
      const targetWordCount = toPositiveInteger(config?.targetWordCount, 1200, 600);
      const includeChecklist = Boolean(config?.includeChecklist);
      const includeGlossary = Boolean(config?.includeGlossary);

      return {
        requestedTopic,
        preferredCategory,
        primaryCategoryFocus: categoryFocus.primaryCategoryFocus,
        secondaryCategoryFocus: categoryFocus.secondaryCategoryFocus,
        referenceCategories,
        bannedCategories,
        allowedTagPool,
        existingTitles: dedupeStrings([...existingTitles, ...recentAiTitles]),
        recentAiTitles,
        recentAiCategories,
        primarySeoKeyword: seoKeywordFocus.primarySeoKeyword,
        secondarySeoKeywords: seoKeywordFocus.secondarySeoKeywords,
        targetAudience,
        toneOfVoice,
        contentGoals,
        requiredSections,
        forbiddenPhrases,
        editorialNotes,
        targetWordCount,
        includeChecklist,
        includeGlossary,
        seoKeywords,
      };
    },

    async generateDraft(requestedTopic?: string | null): Promise<GeneratedAiDraft> {
      const provider = this.getProvider();
      const context = await this.buildGenerationContext(requestedTopic);

      return provider.generateDraft(context);
    },

    async getPreviewImageIdForDraft(draft: GeneratedAiDraft): Promise<number | null> {
      const files = await strapi.db.query(UPLOAD_FILE_UID).findMany({
        select: ['id', 'mime'],
        orderBy: {
          createdAt: 'desc',
        },
        limit: 100,
      });
      const imageFiles = files.filter((file) => file.mime?.startsWith('image/'));

      if (!imageFiles.length) {
        return null;
      }

      const imageIndex = getDeterministicIndex(`${draft.title} ${draft.category}`, imageFiles.length);

      return imageFiles[imageIndex].id;
    },

    async publishDraft(draft: GeneratedAiDraft) {
      const previewImageId = await this.getPreviewImageIdForDraft(draft);
      const existingSlugs = await this.getExistingBlogSlugs();
      const slug = buildUniqueSlug(createSlug(draft.title), existingSlugs);

      return strapi.entityService.create(BLOG_UID, {
        data: {
          ...draft,
          slug,
          ...(previewImageId ? { previewImage: previewImageId } : {}),
          publishedAt: new Date().toISOString(),
        },
      });
    },

    async generateAndPublish(requestedTopic?: string | null) {
      const draft = await this.generateDraft(requestedTopic);
      const createdEntry = await this.publishDraft(draft);

      return {
        id: createdEntry.id,
        title: createdEntry.title,
        previewDescription: createdEntry.previewDescription,
        category: createdEntry.category,
        slug: createdEntry.slug,
        blogType: createdEntry.blogType,
        publishedAt: createdEntry.publishedAt,
        generationMode: this.getProvider().name,
      };
    },
  })
);
