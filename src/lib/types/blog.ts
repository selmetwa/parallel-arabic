export interface ArabicExample {
  arabic: string;
  transliteration: string;
  english: string;
  speaker?: string;
}

export interface VocabTableRow {
  arabic: string;
  masculine: string;
  feminine: string;
  plural: string;
  transliteration: string;
  english: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface SectionHeaderBlock {
  type: 'section-header';
  text: string;
  level?: 2 | 3;
}

export interface ExampleBlock {
  type: 'example';
  caption?: string;
  items: ArabicExample[];
}

export interface VocabTableBlock {
  type: 'vocab-table';
  caption?: string;
  rows: VocabTableRow[];
}

export interface DialogueBlock {
  type: 'dialogue';
  title?: string;
  exchanges: ArabicExample[];
}

export interface CalloutBlock {
  type: 'callout';
  title?: string;
  text: string;
}

export type ContentBlock =
  | ParagraphBlock
  | SectionHeaderBlock
  | ExampleBlock
  | VocabTableBlock
  | DialogueBlock
  | CalloutBlock;

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  dialect: 'egyptian-arabic' | 'levantine' | 'darija' | 'fusha' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedLinks?: { label: string; href: string }[];
  content: ContentBlock[];
}
