export const getWordObjectToSave = async (word: string, type: string) => {
  let question = '';
  if (type === 'arabic') {
    question = `
    Can you please return JSON and no other text for this word where the keys are english, arabic, transliterated. 
    And fill in those values accordingly given the egyptian arabic word. 
    can you please make sure the transliterated value only uses latin characters.
    The word is ${word}
    `;
  } else if (type === 'english') {
    question = `
    Can you please return JSON and no other text for this word where the keys are english, arabic, transliterated. 
    And fill in those values accordingly given the english word. 
    Please make sure that the arabic value is egyptian arabic. 
    Can you please make sure the transliterated value only uses latin characters.
    The word is ${word}
    `;
  } else {
    question = `
    Can you please return JSON and no other text for this word where the keys are english, arabic, transliterated. 
    And fill in those values accordingly given the egyptian arabic word. 
    can you please make sure the transliterated value only uses latin characters.
    The word is ${word}
    `;
  }

  const res = await fetch('/api/get-word-object-to-save', {
    method: 'POST',
    headers: { accept: 'application/json' },
    body: JSON.stringify({
      question: question
    })
  });

  const data = await res.json();

  return data;
}