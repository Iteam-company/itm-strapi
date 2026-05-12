import {
  ArticleGenerationContext,
  ArticleGenerationProvider,
  GeneratedAiDraft,
} from '../article-generation.types';

const buildTitle = (context: ArticleGenerationContext) => {
  const generatedAt = new Date().toISOString();

  if (context.requestedTopic?.trim()) {
    return `${context.requestedTopic.trim()} ${generatedAt}`;
  }

  return `AI Blog Draft ${generatedAt}`;
};

export const mockArticleGenerationProvider: ArticleGenerationProvider = {
  name: 'mock',
  async generateDraft(context: ArticleGenerationContext): Promise<GeneratedAiDraft> {
    const title = buildTitle(context);
    const categoryTags = context.allowedTagPool.slice(0, 4);
    const articleBlocks: GeneratedAiDraft['Article'] = [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: `This post was created by the new article-generation flow inside Strapi for ${context.targetAudience}.`,
          },
        ],
      },
      {
        type: 'heading',
        level: 2,
        children: [
          {
            type: 'text',
            text: 'Why this draft exists',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: context.requestedTopic?.trim()
              ? `This draft was generated from the requested topic "${context.requestedTopic.trim()}".`
              : `We are validating the first AI blog publishing pipeline. The preferred category is "${context.preferredCategory}" and the tone of voice is "${context.toneOfVoice}".`,
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: context.bannedCategories.length
              ? `Banned categories from configuration: ${context.bannedCategories.join(', ')}.`
              : 'No banned categories are configured yet.',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: context.requiredSections.length
              ? `Required sections for future drafts: ${context.requiredSections.join(', ')}.`
              : 'No required sections are configured yet.',
          },
        ],
      },
    ];

    if (context.includeChecklist) {
      articleBlocks.push(
        {
          type: 'heading',
          level: 2,
          children: [{ type: 'text', text: 'Checklist' }],
        },
        {
          type: 'list',
          format: 'unordered',
          children: [
            {
              type: 'list-item',
              children: [
                {
                  type: 'text',
                  text: 'Review the product goal and identify where AI can add practical value.',
                },
              ],
            },
            {
              type: 'list-item',
              children: [
                {
                  type: 'text',
                  text: 'Validate privacy, cost, and implementation constraints before committing to delivery.',
                },
              ],
            },
            {
              type: 'list-item',
              children: [
                {
                  type: 'text',
                  text: 'Document a phased rollout plan instead of trying to automate everything at once.',
                },
              ],
            },
          ],
        },
      );
    }

    if (context.includeGlossary) {
      articleBlocks.push(
        {
          type: 'heading',
          level: 2,
          children: [{ type: 'text', text: 'Glossary' }],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Mock glossary section enabled. In production, this should define key product and engineering terms in simple language.',
            },
          ],
        },
      );
    }

    return {
      title: context.existingTitles.includes(title) ? `${title} Copy` : title,
      previewDescription:
        'This is a first end-to-end AI blog draft created from Strapi to verify the generation and publishing pipeline.',
      category: categoryTags.join(', '),
      blogType: 'ai',
      Article: articleBlocks,
    };
  },
};
