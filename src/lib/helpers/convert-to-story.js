/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
export const convertStory = (story) => {
  const { english, arabic, transliteration, keyWords } = story;

  const englishSentances = english.split('.');
  const arabicSentances = arabic.split('.');
  const transliteratedSentances = transliteration.split('.');

  const output = {
    text: [],
    keyWords: []
  }

  for (let i = 0; i < englishSentances.length; i++) {
    if (arabicSentances[i].length >= 1) {
      output.text.push({
        arabic: arabicSentances[i].split(' '),
        english: englishSentances[i].split(' '),
        transliterated: transliteratedSentances[i].split(' ')
      })
    }
  }

  for (let i = 0; i < keyWords.length; i++) {
    const split = keyWords[i].split("=")
    output.keyWords.push({
      arabic: split[0].trim(),
      english: split[1].trim(),
      transliterated: split[2].trim(),
    })
  }
  return output
}