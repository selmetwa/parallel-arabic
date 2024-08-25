export const possessive_pronouns = [
  { possessive: 'My', value: 'ـي' },
  { possessive: 'You (masc)', value: 'ـك' },
  { possessive: 'You (fem)', value: 'ـك' },
  { possessive: 'His', value: 'ـه' },
  { possessive: 'Her', value: 'ـها' },
  { possessive: 'Our', value: 'ـنا'},
  { possessive: 'Your (pl)', value: 'ـكو' },
  { possessive: 'Their', value: 'ـهم' }
];

export const conjugations = {
  "انا": { possessive: "انا",past: "ت", present: "با", future: "ها", infinitive: "ا" },
  "انتَ": { past: "ت", present: "بت", future: "هت", infinitive: "ت" },
  "انتِ": { past: "تي", present: "بت-ي", future: "هت-ي", infinitive: "تي" },
  "هو": { past: "", present: "بي", future: "هي", infinitive: "ي" },
  "هي": { past: "ت", present: "بت", future: "هت", infinitive: "ت" },
  "احنا": { past: "نا", present: "بن", future: "هن", infinitive: "ن" },
  "انتو": { past: "تو", present: "بت-و", future: "هت-و", infinitive: "ت-و" },
  "هما": { past: "و", present: "بي-و", future: "هي-و", infinitive: "ي-و" }
};

export const conjugation_cases = [
{ possessive: 'I', value: 'انا', tense: 'past' },
{ possessive: 'I', value: 'انا', tense: 'present'},
{ possessive: 'I', value: 'انا', tense: 'future'},
{ possessive: 'I', value: 'انا', tense: 'infinitive'},
{ possessive: 'You masc', value: 'انتَ', tense: 'past' },
{ possessive: 'You masc', value: 'انتَ', tense: 'present'},
{ possessive: 'You masc', value: 'انتَ', tense: 'future'},
{ possessive: 'You masc', value: 'انتَ', tense: 'infinitive'},
{ possessive: 'You feminine', value: 'انتِ', tense: 'past' },
{ possessive: 'You feminine', value: 'انتِ', tense: 'present'},
{ possessive: 'You feminine', value: 'انتِ', tense: 'future'},
{ possessive: 'You feminine', value: 'انتِ', tense: 'infinitive'},
{ possessive: 'He', value: 'هو', tense: 'past' },
{ possessive: 'He', value: 'هو', tense: 'present'},
{ possessive: 'He', value: 'هو', tense: 'future'},
{ possessive: 'He', value: 'هو', tense: 'infinitive'},
{ possessive: 'She', value: 'هي', tense: 'past' },
{ possessive: 'She', value: 'هي', tense: 'present'},
{ possessive: 'She', value: 'هي', tense: 'future'},
{ possessive: 'She', value: 'هي', tense: 'infinitive'},
{ possessive: 'We', value: 'احنا', tense: 'past' },
{ possessive: 'We', value: 'احنا', tense: 'present'},
{ possessive: 'We', value: 'احنا', tense: 'future'},
{ possessive: 'We', value: 'احنا', tense: 'infinitive'},
{ possessive: 'You Plural', value: 'انتو', tense: 'past' },
{ possessive: 'You Plural', value: 'انتو', tense: 'present'},
{ possessive: 'You Plural', value: 'انتو', tense: 'future'},
{ possessive: 'You Plural', value: 'انتو', tense: 'infinitive'},
{ possessive: 'They', value: 'هما', tense: 'past' },
{ possessive: 'They', value: 'هما', tense: 'present'},
{ possessive: 'They', value: 'هما', tense: 'future'},
{ possessive: 'They', value: 'هما', tense: 'infinitive'}
];