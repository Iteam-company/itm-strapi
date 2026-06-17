import {
  ArticleGenerationContext,
  ArticleGenerationProvider,
  GeneratedAiDraft,
  InlineNode,
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
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_ARTICLE_MODEL || 'gpt-5.4-mini';
const DEFAULT_REASONING_EFFORT = process.env.OPENAI_ARTICLE_REASONING_EFFORT || 'medium';
const MAX_GENERATION_ATTEMPTS = Math.max(
  1,
  Math.round(Number(process.env.OPENAI_ARTICLE_MAX_GENERATION_ATTEMPTS || 3)),
);
const MIN_PREVIEW_DESCRIPTION_LENGTH = 80;
const MAX_PREVIEW_DESCRIPTION_LENGTH = 260;
const DEFAULT_MIN_BLOCKS = 7;
const DEFAULT_MIN_HEADINGS = 3;
const MAX_CATEGORY_TAGS = 2;
const GENERIC_HEADING_TITLES = [
  'startup context',
  'ai mvp use cases',
  'delivery risks',
  'partner selection criteria',
  'conclusion',
];
const DEFAULT_REFERENCE_ANGLES = [
  'AI MVP development',
  'Product discovery',
  'Startup validation',
  'Software delivery',
  'SEO content strategy',
] as const;
const INTERNAL_LINK_TARGETS = [
  {
    label: 'AI MVP development services',
    url: '/services',
    signals: ['ai mvp', 'mvp development', 'software partner', 'delivery', 'startup validation'],
  },
  {
    label: 'frontend and software development expertise',
    url: '/development',
    signals: ['angular', 'react', 'frontend', 'software development', 'implementation'],
  },
  {
    label: 'iTeam project portfolio',
    url: '/portfolio',
    signals: ['case study', 'proof', 'examples', 'portfolio', 'delivery partner'],
  },
  {
    label: 'AI-powered MVP launch case study',
    url: '/case/ai_powered_mvp_launch',
    signals: ['ai mvp', 'pilot', 'launch', 'validation', 'startup'],
  },
  {
    label: 'AI MVP development case study',
    url: '/case/ai_mvp_development',
    signals: ['ai mvp development', 'prototype', 'product discovery', 'mvp scope'],
  },
  {
    label: 'contact iTeam',
    url: '/contact_us',
    signals: ['partner selection', 'contact', 'estimate', 'scope review', 'next step'],
  },
] as const;

const TEXT_NODE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'text', 'bold', 'italic', 'underline', 'strikethrough', 'code'],
  properties: {
    type: {
      type: 'string',
      enum: ['text'],
    },
    text: {
      type: 'string',
    },
    bold: {
      type: 'boolean',
    },
    italic: {
      type: 'boolean',
    },
    underline: {
      type: 'boolean',
    },
    strikethrough: {
      type: 'boolean',
    },
    code: {
      type: 'boolean',
    },
  },
} as const;

const LINK_NODE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'url', 'children'],
  properties: {
    type: {
      type: 'string',
      enum: ['link'],
    },
    url: {
      type: 'string',
    },
    children: {
      type: 'array',
      minItems: 1,
      items: TEXT_NODE_SCHEMA,
    },
  },
} as const;

const INLINE_NODE_SCHEMA = {
  anyOf: [TEXT_NODE_SCHEMA, LINK_NODE_SCHEMA],
} as const;

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
                items: INLINE_NODE_SCHEMA,
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
                items: INLINE_NODE_SCHEMA,
              },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'children'],
            properties: {
              type: {
                type: 'string',
                enum: ['code'],
              },
              children: {
                type: 'array',
                minItems: 1,
                items: TEXT_NODE_SCHEMA,
              },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'children'],
            properties: {
              type: {
                type: 'string',
                enum: ['quote'],
              },
              children: {
                type: 'array',
                minItems: 1,
                items: INLINE_NODE_SCHEMA,
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
                      items: INLINE_NODE_SCHEMA,
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

const extractRelevantAngles = (context: ArticleGenerationContext) =>
  [
    ...context.referenceCategories,
    ...context.seoKeywords,
    context.searchIntent,
    ...DEFAULT_REFERENCE_ANGLES,
  ].filter((value, index, items) => value && items.indexOf(value) === index);

const getEffectiveTargetWordCount = (targetWordCount: number) =>
  Math.min(Math.max(targetWordCount, 700), 1050);

const getRelevantInternalLinkTargets = (context: ArticleGenerationContext) => {
  const searchableContext = normalizeText(
    [
      context.requestedTopic || '',
      context.primarySeoKeyword || '',
      context.primaryCategoryFocus,
      context.secondaryCategoryFocus || '',
      context.editorialNotes,
      context.searchIntent,
      context.internalLinkStrategy,
      ...context.seoKeywords,
      ...context.contentGoals,
    ].join(' '),
  );

  return [...INTERNAL_LINK_TARGETS]
    .sort((a, b) => {
      const scoreTarget = (target: (typeof INTERNAL_LINK_TARGETS)[number]) =>
        target.signals.filter((signal) => searchableContext.includes(normalizeText(signal))).length;
      const scoreDelta = scoreTarget(b) - scoreTarget(a);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return INTERNAL_LINK_TARGETS.indexOf(a) - INTERNAL_LINK_TARGETS.indexOf(b);
    })
    .slice(0, 4);
};

const supportsReasoningEffort = (model: string) =>
  model.startsWith('gpt-5') || /^o\d/.test(model);

const shouldAllowVitaliyMention = (context: ArticleGenerationContext) => {
  const normalizedSignals = normalizeText(
    [
      context.targetAudience,
      context.editorialNotes,
      context.searchIntent,
      context.internalLinkStrategy,
      context.preferredCategory,
      ...context.referenceCategories,
      ...context.seoKeywords,
      ...context.contentGoals,
    ].join(' '),
  );

  return ['seo', 'content strategy', 'content', 'organic traffic', 'search', 'discovery'].some((signal) =>
    normalizedSignals.includes(signal),
  );
};

const buildSystemPrompt = (context: ArticleGenerationContext) => `You generate AI blog drafts for iTeam.
Return only structured data that matches the schema.
Write in clear, practical English for a software services company audience.
Do not include markdown fences.
Target audience: ${context.targetAudience}.
Tone of voice: ${context.toneOfVoice}.
Aim for approximately ${getEffectiveTargetWordCount(context.targetWordCount)} words of total content across the article.
When no explicit topic is provided, choose the strongest angle from the available strategy signals instead of defaulting to frontend by habit.
Prefer commercially relevant topics around AI adoption, MVP delivery, product discovery, startup validation, software delivery, and SEO/content strategy when they are supported by the context.
Do not force every article into frontend framing. Frontend is only one possible angle, not the default.
The category field must contain 1 or 2 specialized tags separated by commas, not one generic label.
Use one category tag by default. Use two only when the second tag represents a genuinely distinct angle in the article.
Do not copy every SEO keyword into category. The category field is a narrow classification, not a keyword dump.
Build the category field from this allowed tag pool whenever relevant: ${
  context.allowedTagPool.length ? context.allowedTagPool.join(' | ') : context.preferredCategory
}.
Copy category tags exactly as they appear in the allowed tag pool. Do not shorten, rename, translate, or invent category labels.
Primary category focus for this draft: ${context.primaryCategoryFocus}.
Optional secondary category focus for this draft: ${context.secondaryCategoryFocus || 'none'}.
Use the primary focus as the category unless the requested topic clearly requires another allowed tag.
Use the optional secondary focus only when it represents a genuinely distinct second angle in the article.
Recent AI blog categories to avoid overusing unless highly relevant: ${
  context.recentAiCategories.length ? context.recentAiCategories.join(' | ') : 'none'
}.
Use only the tags that are genuinely relevant to the article. Do not always fill the maximum number of tags.
Avoid overly broad one-word category outputs like "Technology". A single focused tag is acceptable when the topic is narrow.
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
Required editorial topics to cover when relevant: ${
  context.requiredSections.length ? context.requiredSections.join(' | ') : 'Introduction | Practical insights | Conclusion'
}.
Do not use required editorial topic names as verbatim headings. Rewrite them into specific, insight-led headings that fit the chosen article angle.
Forbidden phrases or claims: ${
  context.forbiddenPhrases.length ? context.forbiddenPhrases.join(' | ') : 'none'
}.
Editorial notes: ${context.editorialNotes || 'none'}.
Target SEO keywords to weave in naturally: ${
  context.seoKeywords.length ? context.seoKeywords.join(' | ') : 'none'
}.
Primary SEO query for this draft: ${context.primarySeoKeyword || 'none'}.
Secondary SEO query variants: ${
  context.secondarySeoKeywords.length ? context.secondarySeoKeywords.join(' | ') : 'none'
}.
Search intent guidance from Strapi: ${context.searchIntent || 'none'}.
SEO title guidelines from Strapi: ${context.seoTitleGuidelines || 'none'}.
SEO description guidelines from Strapi: ${context.seoDescriptionGuidelines || 'none'}.
Slug guidelines from Strapi: ${context.slugGuidelines || 'none'}.
Internal linking strategy from Strapi: ${context.internalLinkStrategy || 'none'}.
If a primary SEO query is provided, build the article around the search intent behind that exact query.
Use the primary SEO query naturally in the title when it fits, in the previewDescription, in the opening paragraph, and in one heading or list lead phrase.
Use secondary SEO query variants only when they fit the article. Do not keyword-stuff, repeat awkward phrases, or add irrelevant sections only for SEO.
Prefer search-intent titles such as "AI-Assisted [Technology] MVP: ..." or "How to Validate an AI [Technology] MVP ..." when the primary query is about a specific technology.
The article must answer what a buyer or founder likely wants to know after searching the primary query: use cases, cost/scope tradeoffs, implementation risk, validation plan, and partner selection.
Treat the generated title as the page SEO title. Keep it clear, search-intent aligned, and useful in search results without clickbait.
Treat previewDescription as the page meta description. Make it specific enough to earn a search click, with the primary query or a close natural variant when possible.
Because the blog slug is generated from the title, prefer title wording that creates a readable, focused slug without filler words.
Allowed internal link targets for this draft: ${
  getRelevantInternalLinkTargets(context)
    .map((target) => `${target.label}: ${target.url}`)
    .join(' | ')
}.
Include 2 internal links using Strapi link nodes, not raw URLs. Use descriptive anchor text and only use URLs from the allowed internal link targets.
Place links where they help the reader take the next step, such as services, implementation expertise, relevant case studies, or contact. Do not put links in headings or code blocks.
The post must be useful, specific, and avoid vague filler.
The first Article block must be a paragraph that introduces the practical situation. Do not start the article with a heading.
Before writing, silently define a sharp editorial brief with one target reader, one business problem, one practical situation, one core argument, and one useful takeaway. Do not output the brief as a separate section.
Open with a concrete situation a founder, product owner, or engineering decision-maker would recognize. Avoid generic openings about technology transforming industries.
Each major section must add a distinct practical idea. Prefer decisions, tradeoffs, risks, implementation steps, cost or timeline considerations, or measurement criteria over broad claims.
Include at least one realistic example scenario, one risk or failure mode, and one decision framework or checklist-style set of next steps.
Include 2 to 3 concrete operating details such as a timeline range, pilot metric, acceptance threshold, review rate, cost driver, or delivery phase.
Avoid repeating the same core thesis across multiple sections. If a point has already been made, add a new practical implication instead of restating it.
Prefer 4 to 6 heading blocks. Do not create extra sections just to increase length.
Make headings specific and useful. Avoid generic headings such as "Startup context", "AI MVP use cases", "Delivery risks", "Partner selection criteria", or "Conclusion".
Avoid generic AI-benefit paragraphs. Do not write sections that could fit any software company without changes.
Keep paragraph blocks short. Most paragraph blocks should be 35 to 75 words, and no paragraph should exceed 100 words.
Avoid long uninterrupted text. After every 1 or 2 paragraph blocks, use a list, quote, or visual decision aid when it would improve scanning.
Use 1 to 2 list blocks across the article. At least one list should use bold lead phrases in list-item text nodes, such as a bold decision factor followed by a normal explanation.
Use rich text marks sparingly and deliberately: bold for key terms or decision factors, italic for one caution or takeaway. Do not over-style whole paragraphs.
Include one short quote block that works as a visual callout card. It should be a practical takeaway, risk, rule, or KPI note, not a fabricated person quote.
Keep the quote block under 35 words and make it useful even when skimmed on its own.
Include one compact visual decision aid as a code block. It must not be programming code. Use it as a plain-text table, scorecard, pilot plan, or decision matrix with 4 to 6 rows. Separate columns with the "|" character. Keep each row short enough to scan on mobile.
The previewDescription must be 120 to 180 characters and read like a concise, polished summary, not a generic teaser.
Do not use markdown syntax inside text nodes. Do not use **bold**, bullet markers like "-" inside paragraphs, or numbered markdown inside paragraphs. Use Strapi text-node marks such as bold or italic instead.
Use at least ${DEFAULT_MIN_BLOCKS} content blocks and at least ${DEFAULT_MIN_HEADINGS} heading blocks.
When writing about SEO, organic growth, content operations, or content strategy, you may naturally mention Vitaliy as iTeam's SEO specialist or internal SEO lead when it adds context.
Do not fabricate direct quotes, interviews, or personal opinions from Vitaliy. Only mention him as part of the company's practical point of view when relevant to the article angle.
${
  context.includeChecklist
    ? 'Include a checklist section with a heading that contains the word "Checklist" and provide 5 to 7 high-signal checklist items as an unordered list block, not as dash-prefixed text paragraphs.'
    : ''
}
${
  context.includeGlossary
    ? 'Include a concise glossary section only when the article introduces non-obvious technical or product terms. If included, use a heading that contains the word "Glossary" and define only 3 to 5 non-obvious terms in short plain-language paragraphs without markdown emphasis.'
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
  const candidateAngles = extractRelevantAngles(context);
  const vitaliyGuidance = shouldAllowVitaliyMention(context)
    ? 'If the selected angle is about SEO, content strategy, or organic growth, you may briefly reference Vitaliy as iTeam\'s SEO specialist, but only when it feels natural and useful.'
    : null;

  if (context.requestedTopic?.trim()) {
    return [
      `Create a blog post draft about this topic: ${context.requestedTopic.trim()}`,
      `Use this rotating primary category focus unless the topic clearly conflicts with it: ${context.primaryCategoryFocus}.`,
      context.secondaryCategoryFocus
        ? `Use this secondary focus only if it naturally fits the article: ${context.secondaryCategoryFocus}.`
        : null,
      'Narrow the topic into one specific editorial angle before writing. The article should not be a general overview.',
      'Make the post feel like expert consulting: explain what decision the reader is trying to make, what can go wrong, and how to move forward.',
      attempt > 1
        ? `Previous attempt was rejected. Make the angle and title clearly more distinct from existing titles. Rejection reason: ${options?.rejectionReason || 'validation failed'}.`
        : null,
      context.recentAiTitles.length
        ? `Recent AI blog titles to avoid overlapping with: ${context.recentAiTitles.join(' | ')}.`
        : null,
      vitaliyGuidance,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return [
    `Choose one strong, specific article angle from these signals: ${candidateAngles.join(' | ')}.`,
    `Start from this rotating primary category focus: ${context.primaryCategoryFocus}.`,
    context.secondaryCategoryFocus
      ? `Use this secondary focus only if it creates a useful second angle: ${context.secondaryCategoryFocus}.`
      : null,
    `Do not default to "${context.preferredCategory}" unless it is genuinely the best fit for this article.`,
    'Prioritize the most commercially meaningful angle for iTeam, such as AI MVP delivery, product discovery, startup validation, software delivery, or SEO/content strategy, depending on relevance.',
    'Make the post feel like expert consulting: explain what decision the reader is trying to make, what can go wrong, and how to move forward.',
    'The article should not be a general overview. It must focus on one practical situation and develop it deeply.',
    attempt > 1
      ? `Previous attempt was rejected. Make the angle and title clearly more distinct from existing titles. Rejection reason: ${options?.rejectionReason || 'validation failed'}.`
      : null,
    context.recentAiTitles.length
      ? `Recent AI blog titles to avoid overlapping with: ${context.recentAiTitles.join(' | ')}.`
      : null,
    vitaliyGuidance,
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

const getInlineNodeText = (node: InlineNode) =>
  node.type === 'link'
    ? node.children.map((child) => child.text || '').join(' ')
    : node.text || '';

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
    .flatMap((block) => {
      if (block.type !== 'heading') {
        return [];
      }

      return [normalizeText(block.children.map((child) => getInlineNodeText(child)).join(' '))];
    });

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

const getAllowedInternalUrls = () => INTERNAL_LINK_TARGETS.map((target) => target.url);

const sanitizeInternalUrl = (value: string) => {
  const trimmedValue = value.trim();
  const siteUrl = 'https://iteam-company.com';
  const internalUrl = trimmedValue.startsWith(siteUrl)
    ? trimmedValue.slice(siteUrl.length) || '/'
    : trimmedValue;

  return getAllowedInternalUrls().some((url) => url === internalUrl) ? internalUrl : null;
};

const sanitizeInlineNode = (node: InlineNode): InlineNode => {
  if (node.type === 'link') {
    const sanitizedUrl = sanitizeInternalUrl(node.url);

    return {
      type: 'link',
      url: sanitizedUrl || '/services',
      children: node.children.map((child) => ({
        ...child,
        text: sanitizeInlineText(child.text),
      })),
    };
  }

  return {
    ...node,
    text: sanitizeInlineText(node.text),
  };
};

const trimToMaxLength = (value: string, maxLength: number) => {
  const normalizedValue = value.replace(/\s+/g, ' ').trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return normalizedValue.slice(0, maxLength).replace(/\s+\S*$/, '').replace(/[,:;]$/, '').trim();
};

const getFirstParagraphText = (draft: GeneratedAiDraft) => {
  const firstParagraph = draft.Article.find((block) => block.type === 'paragraph');

  if (!firstParagraph || firstParagraph.type !== 'paragraph') {
    return '';
  }

  return firstParagraph.children
    .map((child) => getInlineNodeText(child))
    .join(' ')
    .trim() || '';
};

const normalizePreviewDescription = (draft: GeneratedAiDraft) => {
  const firstParagraphText = getFirstParagraphText(draft);
  let nextPreview = sanitizeInlineText(draft.previewDescription || '') || firstParagraphText || draft.title || '';

  if (nextPreview.length < MIN_PREVIEW_DESCRIPTION_LENGTH && firstParagraphText) {
    nextPreview = `${nextPreview} ${firstParagraphText}`;
  }

  if (nextPreview.length < MIN_PREVIEW_DESCRIPTION_LENGTH) {
    nextPreview = `${nextPreview} This article helps founders evaluate scope, risk, validation signals, and delivery tradeoffs before investing in a full product build.`;
  }

  return trimToMaxLength(nextPreview, MAX_PREVIEW_DESCRIPTION_LENGTH);
};

const sanitizeDraft = (draft: GeneratedAiDraft): GeneratedAiDraft => {
  const sanitizedCategoryTags = [
    ...new Set(
      draft.category
        .split(',')
        .map((tag) => sanitizeInlineText(tag))
        .filter(Boolean),
    ),
  ];
  const sanitizedArticle = draft.Article.map((block) => {
    if (block.type === 'list') {
      return {
        ...block,
        children: block.children.map((item) => ({
          ...item,
          children: item.children.map(sanitizeInlineNode),
        })),
      };
    }

    if (block.type === 'code') {
      return {
        ...block,
        children: block.children.map((child) => ({
          ...child,
          text: sanitizeInlineText(child.text),
        })),
      };
    }

    return {
      ...block,
      children: block.children.map(sanitizeInlineNode),
    };
  });
  const sanitizedDraft = {
    ...draft,
    title: sanitizeInlineText(draft.title),
    category: sanitizedCategoryTags.join(', '),
    Article: sanitizedArticle,
  };

  return {
    ...sanitizedDraft,
    previewDescription: normalizePreviewDescription(sanitizedDraft),
  };
};

const createTextNode = (text: string) => ({
  type: 'text' as const,
  text: sanitizeInlineText(text),
});

const createMarkedTextNode = (
  text: string,
  marks: { bold?: boolean; italic?: boolean } = {},
) => ({
  ...createTextNode(text),
  ...marks,
});

const createLinkNode = (text: string, url: string) => ({
  type: 'link' as const,
  url,
  children: [createTextNode(text)],
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

const createInternalLinksListBlock = (targets: ReturnType<typeof getRelevantInternalLinkTargets>) => ({
  type: 'list' as const,
  format: 'unordered' as const,
  children: targets.slice(0, 2).map((target) => ({
    type: 'list-item' as const,
    children: [
      createLinkNode(target.label, target.url),
      createTextNode(' is a useful next step for readers who want to turn this decision into a scoped project.'),
    ],
  })),
});

const createCodeBlock = (text: string) => ({
  type: 'code' as const,
  children: [createTextNode(text)],
});

const createQuoteBlock = (text: string) => ({
  type: 'quote' as const,
  children: [createMarkedTextNode(text, { italic: true })],
});

const getInternalLinks = (draft: GeneratedAiDraft) =>
  draft.Article.flatMap((block) =>
    block.children.flatMap((child) => {
      if (child.type === 'link') {
        return [child.url];
      }

      if ('children' in child) {
        return child.children
          .filter((grandChild): grandChild is Extract<InlineNode, { type: 'link' }> => grandChild.type === 'link')
          .map((grandChild) => grandChild.url);
      }

      return [];
    }),
  );

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
  const codeBlocksAfterFallback = draftWithFallbackSections.Article.filter(
    (block) => block.type === 'code',
  );
  const quoteBlocksAfterFallback = draftWithFallbackSections.Article.filter(
    (block) => block.type === 'quote',
  );
  const internalLinksAfterFallback = getInternalLinks(draftWithFallbackSections);

  if (codeBlocksAfterFallback.length === 0) {
    const insertIndex = Math.min(4, draftWithFallbackSections.Article.length);

    draftWithFallbackSections.Article.splice(
      insertIndex,
      0,
      createCodeBlock(
        [
          'Decision check | Strong signal | Risk signal',
          'User problem | Repeated painful workflow | Nice-to-have request',
          'Pilot scope | One measurable task | Several vague use cases',
          'Success metric | Clear baseline to beat | Interest without behavior',
          'Delivery risk | Known data and fallback | Unknown ownership or review',
        ].join('\n'),
      ),
    );
  }

  if (quoteBlocksAfterFallback.length === 0) {
    const insertIndex = Math.min(6, draftWithFallbackSections.Article.length);

    draftWithFallbackSections.Article.splice(
      insertIndex,
      0,
      createQuoteBlock(
        'The first AI MVP should reduce uncertainty, not create a larger product promise than the team can validate.',
      ),
    );
  }

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
        'Define a narrow AI use case tied to a measurable product or business goal.',
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

  if (internalLinksAfterFallback.length === 0) {
    draftWithFallbackSections.Article.push(
      createHeadingBlock('Related next steps'),
      createInternalLinksListBlock(getRelevantInternalLinkTargets(context)),
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

  const searchableDraftText = getSearchableDraftText(draft);

  return context.seoKeywords.filter((keyword) =>
    searchableDraftText.includes(normalizeText(keyword)),
  ).length;
};

const getSearchableDraftText = (draft: GeneratedAiDraft) =>
  normalizeText(`${draft.title} ${draft.previewDescription} ${collectArticleText(draft)}`);

const hasPrimarySeoKeywordCoverage = (draft: GeneratedAiDraft, context: ArticleGenerationContext) => {
  if (!context.primarySeoKeyword) {
    return true;
  }

  return getSearchableDraftText(draft).includes(normalizeText(context.primarySeoKeyword));
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
    draft.previewDescription.trim().length < MIN_PREVIEW_DESCRIPTION_LENGTH ||
    draft.previewDescription.trim().length > MAX_PREVIEW_DESCRIPTION_LENGTH
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

  if (categoryTags.length < 1) {
    throw new Error('Generated draft category must include at least 1 tag.');
  }

  if (categoryTags.length > MAX_CATEGORY_TAGS) {
    throw new Error(`Generated draft category must include at most ${MAX_CATEGORY_TAGS} tags.`);
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
        !context.allowedTagPool.some((allowedTag) => allowedTag.trim().toLowerCase() === tag.trim().toLowerCase()),
    )
  ) {
    throw new Error('Generated draft contains category tags outside the exact allowed tag pool.');
  }

  if (draft.blogType !== 'ai') {
    throw new Error('Generated draft has an invalid blogType.');
  }

  if (!Array.isArray(draft.Article) || draft.Article.length === 0) {
    throw new Error('Generated draft has an empty Article blocks array.');
  }

  if (draft.Article[0].type !== 'paragraph') {
    throw new Error('Generated draft must start with a paragraph block.');
  }

  if (draft.Article.length < DEFAULT_MIN_BLOCKS) {
    throw new Error(`Generated draft must include at least ${DEFAULT_MIN_BLOCKS} content blocks.`);
  }

  const headingBlocks = draft.Article.filter((block) => block.type === 'heading');
  const listBlocks = draft.Article.filter((block) => block.type === 'list');

  if (headingBlocks.length < DEFAULT_MIN_HEADINGS) {
    throw new Error(`Generated draft must include at least ${DEFAULT_MIN_HEADINGS} heading blocks.`);
  }

  const normalizedTitle = normalizeText(draft.title);
  const normalizedHeadings = getHeadingTexts(draft);

  const genericHeading = normalizedHeadings.find((heading) =>
    GENERIC_HEADING_TITLES.includes(heading),
  );

  if (genericHeading) {
    throw new Error(`Generated draft contains a generic heading: "${genericHeading}".`);
  }

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

  const invalidInternalLink = getInternalLinks(draft).find(
    (url) => !getAllowedInternalUrls().includes(url),
  );

  if (invalidInternalLink) {
    throw new Error(`Generated draft contains an unsupported internal link: "${invalidInternalLink}".`);
  }

  if (context.seoKeywords.length) {
    const matchedKeywordsCount = getMatchedKeywordsCount(draft, context);

    if (matchedKeywordsCount < Math.min(2, context.seoKeywords.length)) {
      throw new Error('Generated draft does not naturally include enough SEO keywords.');
    }
  }

  if (!hasPrimarySeoKeywordCoverage(draft, context)) {
    throw new Error(`Generated draft does not include the primary SEO keyword: "${context.primarySeoKeyword}".`);
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
          ...(supportsReasoningEffort(DEFAULT_OPENAI_MODEL)
            ? {
                reasoning: {
                  effort: DEFAULT_REASONING_EFFORT,
                },
              }
            : {}),
          ...(!supportsReasoningEffort(DEFAULT_OPENAI_MODEL) ? { temperature: 0.7 } : {}),
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
        const draft = appendMissingOptionalSections(
          sanitizeDraft(JSON.parse(extractTextOutput(payload)) as GeneratedAiDraft),
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
