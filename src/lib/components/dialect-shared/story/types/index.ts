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