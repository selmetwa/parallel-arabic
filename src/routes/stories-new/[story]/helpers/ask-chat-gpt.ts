export const askChatGTP = async (word: string, type: string) => {
  let question = '';
  if (type === 'arabic') {
    question = `What does ${word} mean in Egyptian Arabic?`;
  } else if (type === 'english') {
    question = `What is the word for ${word} in Egyptian Arabic?`;
  } else {
    question = `What does ${word} mean in Egyptian Arabic?`;
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