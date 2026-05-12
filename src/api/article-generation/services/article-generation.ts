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

const extractNames = (items: NamedComponent[] = []) =>
  items.map(({ name }) => name?.trim()).filter(Boolean) as string[];

const extractListItems = (value?: string | null) =>
  (value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const dedupeStrings = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];
const toPositiveInteger = (value: unknown, fallback: number, min: number) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(min, Math.round(parsedValue));
};

export default factories.createCoreService(
  'api::article-generation.article-generation',
  ({ strapi }) => ({
    async getGenerationConfig(): Promise<ArticleGenerationConfig | null> {
      return strapi.db.query(ARTICLE_GENERATION_UID).findOne({
        populate: ['referenceCategory', 'bannedCetagory', 'exisitigTitles'],
      });
    },

    async getRecentAiTitles(limit = 20): Promise<string[]> {
      const recentAiPosts = await strapi.db.query(BLOG_UID).findMany({
        where: {
          blogType: 'ai',
        },
        select: ['title'],
        orderBy: {
          publishedAt: 'desc',
        },
        limit,
      });

      return dedupeStrings(
        recentAiPosts.map((post) => post.title).filter((title): title is string => Boolean(title)),
      );
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
      const recentAiTitles = await this.getRecentAiTitles();
      const seoKeywords = extractListItems(config?.seoKeywords);
      const preferredCategory = referenceCategories[0] || 'AI, MVP';
      const allowedTagPool = dedupeStrings([
        ...referenceCategories,
        ...seoKeywords,
        preferredCategory,
        'AI',
        'MVP',
        'Product Discovery',
        'Startup Strategy',
        'Frontend Architecture',
        'Software Delivery',
      ]).filter((tag) => !bannedCategories.some((bannedTag) => bannedTag === tag));
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
        referenceCategories,
        bannedCategories,
        allowedTagPool,
        existingTitles: dedupeStrings([...existingTitles, ...recentAiTitles]),
        recentAiTitles,
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

    async publishDraft(draft: GeneratedAiDraft) {
      return strapi.entityService.create(BLOG_UID, {
        data: {
          ...draft,
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
        blogType: createdEntry.blogType,
        publishedAt: createdEntry.publishedAt,
        generationMode: this.getProvider().name,
      };
    },
  })
);
