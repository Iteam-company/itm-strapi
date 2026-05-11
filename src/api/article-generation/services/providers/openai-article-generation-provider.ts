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
const MAX_GENERATION_ATTEMPTS = 3;

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
Target audience: ${context.targetAudience}.
Tone of voice: ${context.toneOfVoice}.
Do not use categories from this banned list: ${
  context.bannedCategories.length ? context.bannedCategories.join(', ') : 'none'
}.
Prefer these categories when relevant: ${
  context.referenceCategories.length ? context.referenceCategories.join(', ') : context.preferredCategory
}.
Avoid duplicating or closely paraphrasing these existing titles: ${
  context.existingTitles.length ? context.existingTitles.join(' | ') : 'none'
}.
Content goals: ${context.contentGoals.length ? context.contentGoals.join(' | ') : 'provide practical value and concrete insights'}.
Required sections to cover with heading blocks when relevant: ${
  context.requiredSections.length ? context.requiredSections.join(' | ') : 'Introduction | Practical insights | Conclusion'
}.
Forbidden phrases or claims: ${
  context.forbiddenPhrases.length ? context.forbiddenPhrases.join(' | ') : 'none'
}.
Editorial notes: ${context.editorialNotes || 'none'}.
The post must be useful, specific, and avoid vague filler.
The previewDescription should read like a concise, polished summary, not a generic teaser.
Use at least 5 content blocks and at least 2 heading blocks.`;

const buildUserPrompt = (
  context: ArticleGenerationContext,
  options?: {
    attempt?: number;
    rejectionReason?: string;
  },
) => {
  const attempt = options?.attempt || 1;

  if (context.requestedTopic?.trim()) {
    return [
      `Create a blog post draft about this topic: ${context.requestedTopic.trim()}`,
      attempt > 1
        ? `Previous attempt was rejected. Make the angle and title clearly more distinct from existing titles. Rejection reason: ${options?.rejectionReason || 'validation failed'}.`
        : null,
      context.recentAiTitles.length
        ? `Recent AI blog titles to avoid overlapping with: ${context.recentAiTitles.join(' | ')}.`
        : null,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return [
    `Create a blog post draft in the preferred category "${context.preferredCategory}".`,
    attempt > 1
      ? `Previous attempt was rejected. Make the angle and title clearly more distinct from existing titles. Rejection reason: ${options?.rejectionReason || 'validation failed'}.`
      : null,
    context.recentAiTitles.length
      ? `Recent AI blog titles to avoid overlapping with: ${context.recentAiTitles.join(' | ')}.`
      : null,
  ]
    .filter(Boolean)
    .join(' ');
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const collectArticleText = (draft: GeneratedAiDraft) =>
  draft.Article.flatMap((block) => block.children.map((child) => child.text || '')).join(' ');

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

const validateDraft = (draft: GeneratedAiDraft, context: ArticleGenerationContext) => {
  if (!draft.title?.trim()) {
    throw new Error('Generated draft has an empty title.');
  }

  if (draft.title.trim().length < 20 || draft.title.trim().length > 100) {
    throw new Error('Generated draft title length is outside the allowed range.');
  }

  if (!draft.previewDescription?.trim()) {
    throw new Error('Generated draft has an empty previewDescription.');
  }

  if (
    draft.previewDescription.trim().length < 80 ||
    draft.previewDescription.trim().length > 260
  ) {
    throw new Error('Generated draft previewDescription length is outside the allowed range.');
  }

  if (!draft.category?.trim()) {
    throw new Error('Generated draft has an empty category.');
  }

  if (
    context.bannedCategories.some(
      (category) => normalizeText(category) === normalizeText(draft.category.trim()),
    )
  ) {
    throw new Error('Generated draft category is in the banned categories list.');
  }

  if (draft.blogType !== 'ai') {
    throw new Error('Generated draft has an invalid blogType.');
  }

  if (!Array.isArray(draft.Article) || draft.Article.length === 0) {
    throw new Error('Generated draft has an empty Article blocks array.');
  }

  if (draft.Article.length < 5) {
    throw new Error('Generated draft must include at least 5 content blocks.');
  }

  const headingBlocks = draft.Article.filter((block) => block.type === 'heading');

  if (headingBlocks.length < 2) {
    throw new Error('Generated draft must include at least 2 heading blocks.');
  }

  const normalizedTitle = normalizeText(draft.title);

  if (
    context.existingTitles.some((title) => {
      const normalizedExistingTitle = normalizeText(title);
      return (
        normalizedExistingTitle === normalizedTitle ||
        normalizedExistingTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(normalizedExistingTitle)
      );
    })
  ) {
    throw new Error('Generated draft title is too close to an existing title.');
  }

  if (context.forbiddenPhrases.length) {
    const searchableDraftText = normalizeText(
      `${draft.title} ${draft.previewDescription} ${collectArticleText(draft)}`,
    );
    const matchedForbiddenPhrase = context.forbiddenPhrases.find((phrase) =>
      searchableDraftText.includes(normalizeText(phrase)),
    );

    if (matchedForbiddenPhrase) {
      throw new Error(`Generated draft contains a forbidden phrase: "${matchedForbiddenPhrase}".`);
    }
  }

  if (context.requiredSections.length) {
    const normalizedHeadings = headingBlocks.map((block) =>
      normalizeText(block.children.map((child) => child.text || '').join(' ')),
    );
    const missingRequiredSection = context.requiredSections.find((section) => {
      const normalizedSection = normalizeText(section);
      return normalizedSection && !normalizedHeadings.some((heading) => heading.includes(normalizedSection));
    });

    if (missingRequiredSection) {
      throw new Error(
        `Generated draft is missing a required section heading related to "${missingRequiredSection}".`,
      );
    }
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

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
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
              content: buildUserPrompt(context, {
                attempt,
                rejectionReason: lastError?.message,
              }),
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

      try {
        const draft = JSON.parse(extractTextOutput(payload)) as GeneratedAiDraft;

        return validateDraft(draft, context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Draft validation failed.');
      }
    }

    throw lastError || new Error('Draft generation failed after multiple attempts.');
  },
};
