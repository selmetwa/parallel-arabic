export type Keyboard = {
  getTextAreaValue: () => string | undefined;
  resetValue: () => void;
  style: {
    setProperty: (key: string, value: string) => void;
  };
  addEventListener: (event: string, callback: (e: Event) => void) => void;
};

export type Letter = {
  name:  string,
  key: string,
  description: string,
  isolated: string,
  start: string | null,
  middle: string | null,
  end: string
}

export type wordObjectItem = {
  arabic: string
  english: string
  transliteration: string
  audioUrl?: string
}

export type wordObjectGroup = {
[key: string]: wordObjectItem
first: wordObjectItem
second: wordObjectItem
third: wordObjectItem
fourth: wordObjectItem
answer: wordObjectItem
}

export type sentenceObjectItem = {
  arabic: string
  english: string
  transliteration: string
}

export type sentenceObjectGroup = {
  [key: string]: sentenceObjectItem
  first: sentenceObjectItem
  second: sentenceObjectItem
  third: sentenceObjectItem
  fourth: sentenceObjectItem
  answer: sentenceObjectItem
}

export type Dialect = 'fusha' | 'levantine' | 'darija' | 'egyptian-arabic' | 'iraqi' | 'khaleeji';

export type DialectName = {
  fusha: 'Modern Standard Arabic',
  levantine: 'Levantine Arabic',
  darija: 'Moroccan Darija',
  'egyptian-arabic': 'Egyptian Arabic',
  iraqi: 'Iraqi Arabic',
  khaleeji: 'Khaleeji Arabic'
}

export enum Mode {
  SingleText = 'SingleText',
  BiText = 'BiText',
  SentanceView = 'SentanceView'
}

export type KeyWord = {
  arabic: string;
  english: string;
  transliterated: string;
  description: string;
  isLoading: boolean;
  type: string;
}