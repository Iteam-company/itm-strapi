export type NamedComponent = {
  name?: string | null;
};

export type ArticleGenerationConfig = {
  referenceCategory?: NamedComponent[];
  bannedCetagory?: NamedComponent[];
  exisitigTitles?: NamedComponent[];
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
};

export type ArticleGenerationProvider = {
  name: string;
  generateDraft: (context: ArticleGenerationContext) => Promise<GeneratedAiDraft>;
};
