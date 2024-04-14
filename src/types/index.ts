export type Keyboard = {
  getTextAreaValue: () => string | undefined;
  resetValue: () => void;
  style: {
    setProperty: (key: string, value: string) => void;
  };
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