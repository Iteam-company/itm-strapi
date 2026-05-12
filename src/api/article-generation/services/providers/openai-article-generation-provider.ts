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
const DEFAULT_MIN_BLOCKS = 7;

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
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'format', 'children'],
            properties: {
              type: {
                type: 'string',
                enum: ['list'],
              },
              format: {
                type: 'string',
                enum: ['ordered', 'unordered'],
              },
              children: {
                type: 'array',
                minItems: 2,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'children'],
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['list-item'],
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
Aim for approximately ${context.targetWordCount} words of total content across the article.
The category field must contain 3 to 5 specialized tags separated by commas, not one generic label.
Build the category field from this allowed tag pool whenever relevant: ${
  context.allowedTagPool.length ? context.allowedTagPool.join(' | ') : context.preferredCategory
}.
Avoid overly broad one-word category outputs like "Frontend" or "Technology" unless combined with more specific tags.
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
Target SEO keywords to weave in naturally: ${
  context.seoKeywords.length ? context.seoKeywords.join(' | ') : 'none'
}.
The post must be useful, specific, and avoid vague filler.
The previewDescription should read like a concise, polished summary, not a generic teaser.
Do not use markdown syntax inside text nodes. Do not use **bold**, bullet markers like "-" inside paragraphs, or numbered markdown inside paragraphs.
Use at least ${DEFAULT_MIN_BLOCKS} content blocks and at least 3 heading blocks.
${
  context.includeChecklist
    ? 'Include a checklist section with a heading that contains the word "Checklist" and provide the checklist as an unordered list block, not as dash-prefixed text paragraphs.'
    : ''
}
${
  context.includeGlossary
    ? 'Include a glossary section with a heading that contains the word "Glossary" and define important terms in short plain-language paragraphs without markdown emphasis.'
    : ''
}`;

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
  draft.Article
    .flatMap((block) =>
      block.children.flatMap((child) =>
        'text' in child
          ? [child.text || '']
          : child.children.map((grandChild) => grandChild.text || ''),
      ),
    )
    .join(' ');

const getHeadingTexts = (draft: GeneratedAiDraft) =>
  draft.Article
    .filter((block) => block.type === 'heading')
    .map((block) => normalizeText(block.children.map((child) => child.text || '').join(' ')));

const hasHeadingContaining = (headings: string[], term: string) => {
  const normalizedTerm = normalizeText(term);
  return headings.some((heading) => heading.includes(normalizedTerm));
};

const hasHeadingMatchingAny = (headings: string[], terms: string[]) =>
  terms.some((term) => hasHeadingContaining(headings, term));

const sanitizeInlineText = (value: string) =>
  value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\s+\n/g, '\n')
    .trim();

const sanitizeDraft = (draft: GeneratedAiDraft): GeneratedAiDraft => ({
  ...draft,
  title: sanitizeInlineText(draft.title),
  previewDescription: sanitizeInlineText(draft.previewDescription),
  category: sanitizeInlineText(draft.category),
  Article: draft.Article.map((block) => {
    if (block.type === 'list') {
      return {
        ...block,
        children: block.children.map((item) => ({
          ...item,
          children: item.children.map((child) => ({
            ...child,
            text: sanitizeInlineText(child.text),
          })),
        })),
      };
    }

    return {
      ...block,
      children: block.children.map((child) => ({
        ...child,
        text: sanitizeInlineText(child.text),
      })),
    };
  }),
});

const createTextNode = (text: string) => ({
  type: 'text' as const,
  text: sanitizeInlineText(text),
});

const createParagraphBlock = (text: string) => ({
  type: 'paragraph' as const,
  children: [createTextNode(text)],
});

const createHeadingBlock = (text: string, level: 2 | 3 = 2) => ({
  type: 'heading' as const,
  level,
  children: [createTextNode(text)],
});

const createUnorderedListBlock = (items: string[]) => ({
  type: 'list' as const,
  format: 'unordered' as const,
  children: items.map((item) => ({
    type: 'list-item' as const,
    children: [createTextNode(item)],
  })),
});

const appendMissingOptionalSections = (
  draft: GeneratedAiDraft,
  context: ArticleGenerationContext,
): GeneratedAiDraft => {
  const nextArticle = [...draft.Article];
  const draftWithFallbackSections = {
    ...draft,
    Article: nextArticle,
  };

  const headingsAfterFallback = getHeadingTexts(draftWithFallbackSections);
  const listBlocksAfterFallback = draftWithFallbackSections.Article.filter(
    (block) => block.type === 'list',
  );

  if (
    context.includeChecklist &&
    listBlocksAfterFallback.length === 0 &&
    !hasHeadingMatchingAny(headingsAfterFallback, [
      'checklist',
      'implementation checklist',
      'evaluation checklist',
      'next steps',
      'action plan',
      'practical steps',
      'what to do next',
    ])
  ) {
    draftWithFallbackSections.Article.push(
      createHeadingBlock('Checklist'),
      createUnorderedListBlock([
        'Define a narrow AI use case tied to a measurable frontend or product goal.',
        'Review privacy, compliance, and data quality risks before implementation starts.',
        'Estimate integration effort, maintenance cost, and required team capabilities.',
        'Test the feature with real users and compare outcomes against a non-AI baseline.',
      ]),
    );
  } else if (context.includeChecklist && listBlocksAfterFallback.length === 0) {
    draftWithFallbackSections.Article.push(
      createUnorderedListBlock([
        'Confirm the project goal and expected user value.',
        'Validate technical feasibility and data constraints.',
        'Plan rollout, testing, and measurement before launch.',
      ]),
    );
  }

  const headingsAfterChecklist = getHeadingTexts(draftWithFallbackSections);

  if (
    context.includeGlossary &&
    !hasHeadingMatchingAny(headingsAfterChecklist, [
      'glossary',
      'glossary of terms',
      'key terms',
      'definitions',
      'terms to know',
    ])
  ) {
    draftWithFallbackSections.Article.push(
      createHeadingBlock('Glossary'),
      createParagraphBlock(
        'MVP: The smallest product version that can be released to validate demand, collect feedback, and support informed product decisions.',
      ),
      createParagraphBlock(
        'Product discovery: The process of validating user problems, solution assumptions, and business priorities before scaling delivery.',
      ),
      createParagraphBlock(
        'Frontend architecture: The structural approach used to organize UI code, state, rendering, and integration patterns in a maintainable way.',
      ),
    );
  }

  return draftWithFallbackSections;
};

const getMatchedKeywordsCount = (draft: GeneratedAiDraft, context: ArticleGenerationContext) => {
  if (!context.seoKeywords.length) {
    return 0;
  }

  const searchableDraftText = normalizeText(
    `${draft.title} ${draft.previewDescription} ${collectArticleText(draft)}`,
  );

  return context.seoKeywords.filter((keyword) =>
    searchableDraftText.includes(normalizeText(keyword)),
  ).length;
};

const ensureSeoKeywordCoverage = (
  draft: GeneratedAiDraft,
  context: ArticleGenerationContext,
): GeneratedAiDraft => {
  if (!context.seoKeywords.length) {
    return draft;
  }

  const minimumMatchedKeywords = Math.min(2, context.seoKeywords.length);
  const matchedKeywordsCount = getMatchedKeywordsCount(draft, context);

  if (matchedKeywordsCount >= minimumMatchedKeywords) {
    return draft;
  }

  const missingKeywords = context.seoKeywords
    .filter((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      const searchableDraftText = normalizeText(
        `${draft.title} ${draft.previewDescription} ${collectArticleText(draft)}`,
      );

      return !searchableDraftText.includes(normalizedKeyword);
    })
    .slice(0, minimumMatchedKeywords - matchedKeywordsCount);

  if (!missingKeywords.length) {
    return draft;
  }

  return {
    ...draft,
    Article: [
      ...draft.Article,
      createHeadingBlock('Key SEO Themes'),
      createParagraphBlock(
        `This article also covers ${missingKeywords.join(', ')} as part of the broader discussion around frontend delivery, product discovery, and practical implementation planning.`,
      ),
    ],
  };
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

  const categoryTags = draft.category
    .split(',')
    .map((tag) => sanitizeInlineText(tag))
    .filter(Boolean);

  if (categoryTags.length < 3) {
    throw new Error('Generated draft category must include at least 3 tags.');
  }

  if (categoryTags.length > 5) {
    throw new Error('Generated draft category must include at most 5 tags.');
  }

  if (
    categoryTags.some((tag) =>
      context.bannedCategories.some(
        (category) => normalizeText(category) === normalizeText(tag),
      ),
    )
  ) {
    throw new Error('Generated draft category is in the banned categories list.');
  }

  if (
    context.allowedTagPool.length &&
    categoryTags.some(
      (tag) =>
        !context.allowedTagPool.some(
          (allowedTag) => normalizeText(allowedTag) === normalizeText(tag),
        ),
    )
  ) {
    throw new Error('Generated draft contains category tags outside the allowed tag pool.');
  }

  if (draft.blogType !== 'ai') {
    throw new Error('Generated draft has an invalid blogType.');
  }

  if (!Array.isArray(draft.Article) || draft.Article.length === 0) {
    throw new Error('Generated draft has an empty Article blocks array.');
  }

  if (draft.Article.length < DEFAULT_MIN_BLOCKS) {
    throw new Error(`Generated draft must include at least ${DEFAULT_MIN_BLOCKS} content blocks.`);
  }

  const headingBlocks = draft.Article.filter((block) => block.type === 'heading');
  const listBlocks = draft.Article.filter((block) => block.type === 'list');

  if (headingBlocks.length < 3) {
    throw new Error('Generated draft must include at least 3 heading blocks.');
  }

  const normalizedTitle = normalizeText(draft.title);
  const normalizedHeadings = getHeadingTexts(draft);

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

  const hasChecklistHeading = hasHeadingMatchingAny(normalizedHeadings, [
    'checklist',
    'implementation checklist',
    'evaluation checklist',
    'next steps',
    'action plan',
    'practical steps',
    'what to do next',
  ]);

  if (context.includeChecklist && listBlocks.length === 0) {
    throw new Error('Generated draft is missing a checklist list block.');
  }

  if (context.includeChecklist && !hasChecklistHeading && listBlocks.length === 0) {
    throw new Error('Generated draft is missing a checklist section.');
  }

  if (
    context.includeGlossary &&
    !hasHeadingMatchingAny(normalizedHeadings, [
      'glossary',
      'glossary of terms',
      'key terms',
      'definitions',
      'terms to know',
    ])
  ) {
    throw new Error('Generated draft is missing a glossary section.');
  }

  if (context.seoKeywords.length) {
    const matchedKeywordsCount = getMatchedKeywordsCount(draft, context);

    if (matchedKeywordsCount < Math.min(2, context.seoKeywords.length)) {
      throw new Error('Generated draft does not naturally include enough SEO keywords.');
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
        const draft = ensureSeoKeywordCoverage(
          appendMissingOptionalSections(
            sanitizeDraft(JSON.parse(extractTextOutput(payload)) as GeneratedAiDraft),
            context,
          ),
          context,
        );

        return validateDraft(draft, context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Draft validation failed.');
      }
    }

    throw lastError || new Error('Draft generation failed after multiple attempts.');
  },
};
