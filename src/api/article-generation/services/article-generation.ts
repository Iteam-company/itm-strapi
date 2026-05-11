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

export default factories.createCoreService(
  'api::article-generation.article-generation',
  ({ strapi }) => ({
    async getGenerationConfig(): Promise<ArticleGenerationConfig | null> {
      return strapi.db.query(ARTICLE_GENERATION_UID).findOne({
        populate: ['referenceCategory', 'bannedCetagory', 'exisitigTitles'],
      });
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
      const preferredCategory = referenceCategories[0] || 'AI, MVP';

      return {
        requestedTopic,
        preferredCategory,
        referenceCategories,
        bannedCategories,
        existingTitles,
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
