export type StoryObj = {
  created_at: string;
  description: string;
  title: string;
  id: string;
  key: string;
  difficulty: number;
}

export type KeyWord = {
  arabic: string;
  english: string;
  transliterated: string;
}

export type TextObj = {
  arabic: string[];
  english: string[];
  transliterated: string[];
}

export type FormattedStory = {
  keyWords: KeyWord[];
  text: TextObj[]
}

export type ResponseData = {
  created_at: string;
  description: string;
  title: string;
  id: string;
  key: string;
  difficulty: number;
}

export enum Mode {
  SingleText = 'SingleText',
  BiText = 'BiText',
  SentanceView = 'SentanceView'
}