type Sentence = {
  arabic: string
  english: string
  transliteration: string
};

export const getDefinitionInSentence = async (word: string, sentence: Sentence) => {
  const question = `What does ${word} mean in Egyptian Arabic? ${sentence.arabic} ${sentence.english} ${sentence.transliteration}`;

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