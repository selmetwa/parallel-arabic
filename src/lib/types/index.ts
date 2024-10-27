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
  egyptianArabic: string
  english: string
  egyptianArabicTransliteration: string
  standardArabic: string
  standardArabicTransliteration: string
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