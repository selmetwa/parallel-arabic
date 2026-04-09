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
  arabicTashkeel?: string
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
}

export enum Mode {
  Condensed = 'Condensed',
  Classic = 'Classic'
}

export type KeyWord = {
  arabic: string;
  english: string;
  transliterated: string;
  description: string;
  isLoading: boolean;
  type: string;
}

// Verb conjugation types
export type VerbPerson = 'ana' | 'enta' | 'enti' | 'howa' | 'heya' | 'ehna' | 'entu' | 'homma';
export type VerbTense = 'past' | 'present' | 'future';
export type VerbForm = 'affirmative' | 'negative';
export type VerbClass = 'sound' | 'hollow' | 'defective' | 'irregular' | 'doubled';
export type ObjectPronounTarget = 'me' | 'you_m' | 'you_f' | 'him_it' | 'her_it' | 'us' | 'you_pl' | 'them';

export interface ConjugationEntry {
  person: VerbPerson;
  arabic: string;
  transliteration: string;
  english: string;
}

export interface ObjectPronounEntry {
  object: ObjectPronounTarget;
  suffix: string;
  arabic: string;
  transliteration: string;
  english: string;
}

export interface VerbConjugationData {
  slug: string;
  arabic: string;
  transliteration: string;
  english: string;
  rootLetters: string;
  verbClass: VerbClass;
  notes: string;
  conjugations: {
    past: {
      affirmative: ConjugationEntry[];
      negative: ConjugationEntry[];
    };
    present: {
      affirmative: ConjugationEntry[];
      negative: ConjugationEntry[];
    };
    future: {
      affirmative: ConjugationEntry[];
      negative: ConjugationEntry[];
    };
  };
  objectPronouns: ObjectPronounEntry[];
}

export interface VerbIndexEntry {
  slug: string;
  arabic: string;
  transliteration: string;
  english: string;
  wordId: string;
  rootLetters: string;
  verbClass: VerbClass;
}

export interface VerbConjugationIndex {
  dialect: string;
  generatedAt: string;
  verbs: VerbIndexEntry[];
}