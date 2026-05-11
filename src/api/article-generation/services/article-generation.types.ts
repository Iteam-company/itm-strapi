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
};

export type TextNode = {
  type: 'text';
  text: string;
};

export type ParagraphBlock = {
  type: 'paragraph';
  children: TextNode[];
};

export type HeadingBlock = {
  type: 'heading';
  level: 2 | 3 | 4 | 5 | 6;
  children: TextNode[];
};

export type BlogBlock = ParagraphBlock | HeadingBlock;

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
  referenceCategories: string[];
  bannedCategories: string[];
  existingTitles: string[];
  recentAiTitles: string[];
  targetAudience: string;
  toneOfVoice: string;
  contentGoals: string[];
  requiredSections: string[];
  forbiddenPhrases: string[];
  editorialNotes: string;
};

export type ArticleGenerationProvider = {
  name: string;
  generateDraft: (context: ArticleGenerationContext) => Promise<GeneratedAiDraft>;
};
