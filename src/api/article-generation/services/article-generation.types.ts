export type NamedComponent = {
  name?: string | null;
};

export type ArticleGenerationConfig = {
  referenceCategory?: NamedComponent[];
  bannedCetagory?: NamedComponent[];
  exisitigTitles?: NamedComponent[];
  targetAudience?: string | null;
  toneOfVoice?: string | null;
  contentGoals?: string | null;
  requiredSections?: string | null;
  forbiddenPhrases?: string | null;
  editorialNotes?: string | null;
  targetWordCount?: number | null;
  includeChecklist?: boolean | null;
  includeGlossary?: boolean | null;
  seoKeywords?: string | null;
  searchIntent?: string | null;
  seoTitleGuidelines?: string | null;
  seoDescriptionGuidelines?: string | null;
  slugGuidelines?: string | null;
  internalLinkStrategy?: string | null;
};

export type TextNode = {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

export type LinkNode = {
  type: 'link';
  url: string;
  children: TextNode[];
};

export type InlineNode = TextNode | LinkNode;

export type ListItemNode = {
  type: 'list-item';
  children: InlineNode[];
};

export type ParagraphBlock = {
  type: 'paragraph';
  children: InlineNode[];
};

export type HeadingBlock = {
  type: 'heading';
  level: 2 | 3 | 4 | 5 | 6;
  children: InlineNode[];
};

export type ListBlock = {
  type: 'list';
  format: 'ordered' | 'unordered';
  children: ListItemNode[];
};

export type CodeBlock = {
  type: 'code';
  children: TextNode[];
};

export type QuoteBlock = {
  type: 'quote';
  children: InlineNode[];
};

export type BlogBlock = ParagraphBlock | HeadingBlock | ListBlock | CodeBlock | QuoteBlock;

export type GeneratedAiDraft = {
  title: string;
  previewDescription: string;
  category: string;
  Article: BlogBlock[];
  blogType: 'ai';
};

export type ArticleGenerationContext = {
  requestedTopic?: string | null;
  preferredCategory: string;
  primaryCategoryFocus: string;
  secondaryCategoryFocus?: string | null;
  referenceCategories: string[];
  bannedCategories: string[];
  allowedTagPool: string[];
  existingTitles: string[];
  recentAiTitles: string[];
  recentAiCategories: string[];
  primarySeoKeyword?: string | null;
  secondarySeoKeywords: string[];
  targetAudience: string;
  toneOfVoice: string;
  contentGoals: string[];
  requiredSections: string[];
  forbiddenPhrases: string[];
  editorialNotes: string;
  targetWordCount: number;
  includeChecklist: boolean;
  includeGlossary: boolean;
  seoKeywords: string[];
  searchIntent: string;
  seoTitleGuidelines: string;
  seoDescriptionGuidelines: string;
  slugGuidelines: string;
  internalLinkStrategy: string;
};

export type ArticleGenerationProvider = {
  name: string;
  generateDraft: (context: ArticleGenerationContext) => Promise<GeneratedAiDraft>;
};
