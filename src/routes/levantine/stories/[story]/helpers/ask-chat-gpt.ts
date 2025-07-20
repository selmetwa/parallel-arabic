type TFullSentence = {
  english: string;
  arabic: string;
  transliteration: string;
}

export const askChatGTP = async (word: string, type: string, fullSentence: TFullSentence) => {
  let question = '';

  const a = `Please use the following text to get the definition: ${fullSentence.arabic} ${fullSentence.transliteration} ${fullSentence.english}`;
  if (type === 'arabic') {
    question = `What does ${word} mean in Levantine Arabic? ${a} `;
  } else if (type === 'english') {
    question = `What is the word for ${word} in Levantine Arabic? ${a}`;
  } else {
    question = `What does ${word} mean in Levantine Arabic? ${a}`;
  }

  const res = await fetch('/api/open-ai', {
    method: 'POST',
    headers: { accept: 'application/json' },
    body: JSON.stringify({
      question: question
    })
  });

  const data = await res.json();

  return data;
}