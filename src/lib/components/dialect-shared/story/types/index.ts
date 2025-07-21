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