import {
  ArticleGenerationContext,
  ArticleGenerationProvider,
  GeneratedAiDraft,
} from '../article-generation.types';

type OpenAIResponse = {
  error?: {
    message?: string;
  };
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
};

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_ARTICLE_MODEL || 'gpt-4o-mini';

const ARTICLE_DRAFT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'previewDescription', 'category', 'Article', 'blogType'],
  properties: {
    title: {
      type: 'string',
    },
    previewDescription: {
      type: 'string',
    },
    category: {
      type: 'string',
    },
    blogType: {
      type: 'string',
      enum: ['ai'],
    },
    Article: {
      type: 'array',
      minItems: 3,
      items: {
        anyOf: [
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'children'],
            properties: {
              type: {
                type: 'string',
                enum: ['paragraph'],
              },
              children: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'text'],
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['text'],
                    },
                    text: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'level', 'children'],
            properties: {
              type: {
                type: 'string',
                enum: ['heading'],
              },
              level: {
                type: 'integer',
                enum: [2, 3, 4, 5, 6],
              },
              children: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'text'],
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['text'],
                    },
                    text: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
} as const;

const buildSystemPrompt = (context: ArticleGenerationContext) => `You generate AI blog drafts for iTeam.
Return only structured data that matches the schema.
Write in clear, practical English for a software services company audience.
Do not include markdown fences.
Do not use categories from this banned list: ${
  context.bannedCategories.length ? context.bannedCategories.join(', ') : 'none'
}.
Prefer these categories when relevant: ${
  context.referenceCategories.length ? context.referenceCategories.join(', ') : context.preferredCategory
}.
Avoid duplicating or closely paraphrasing these existing titles: ${
  context.existingTitles.length ? context.existingTitles.join(' | ') : 'none'
}.`;

const buildUserPrompt = (context: ArticleGenerationContext) => {
  if (context.requestedTopic?.trim()) {
    return `Create a blog post draft about this topic: ${context.requestedTopic.trim()}`;
  }

  return `Create a blog post draft in the preferred category "${context.preferredCategory}".`;
};

const extractTextOutput = (response: OpenAIResponse) => {
  const contentItems =
    response.output?.flatMap((item) => item.content || []).filter(Boolean) || [];

  const refusal = contentItems.find((item) => item.type === 'refusal')?.refusal;
  if (refusal) {
    throw new Error(`OpenAI refused the request: ${refusal}`);
  }

  const text = contentItems
    .filter((item) => item.type === 'output_text' || item.type === 'text')
    .map((item) => item.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('OpenAI returned no text output.');
  }

  return text;
};

const validateDraft = (draft: GeneratedAiDraft) => {
  if (!draft.title?.trim()) {
    throw new Error('Generated draft has an empty title.');
  }

  if (!draft.previewDescription?.trim()) {
    throw new Error('Generated draft has an empty previewDescription.');
  }

  if (!draft.category?.trim()) {
    throw new Error('Generated draft has an empty category.');
  }

  if (draft.blogType !== 'ai') {
    throw new Error('Generated draft has an invalid blogType.');
  }

  if (!Array.isArray(draft.Article) || draft.Article.length === 0) {
    throw new Error('Generated draft has an empty Article blocks array.');
  }

  return draft;
};

export const openaiArticleGenerationProvider: ArticleGenerationProvider = {
  name: 'openai',
  async generateDraft(context: ArticleGenerationContext): Promise<GeneratedAiDraft> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured.');
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_OPENAI_MODEL,
        temperature: 0.7,
        input: [
          {
            role: 'system',
            content: buildSystemPrompt(context),
          },
          {
            role: 'user',
            content: buildUserPrompt(context),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'ai_blog_draft',
            strict: true,
            schema: ARTICLE_DRAFT_SCHEMA,
          },
        },
      }),
    });

    const payload = (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message || 'OpenAI request failed.');
    }

    const draft = JSON.parse(extractTextOutput(payload)) as GeneratedAiDraft;

    return validateDraft(draft);
  },
};
