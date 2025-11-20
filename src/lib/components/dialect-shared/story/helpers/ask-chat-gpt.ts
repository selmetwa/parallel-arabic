import { type Dialect } from '$lib/types/index';

type TFullSentence = {
  english: string;
  arabic: string;
  transliteration: string;
}

export const askChatGTP = async (word: string, type: string, fullSentence: TFullSentence, dialect: Dialect) => {
  let question = '';

  const dialectName: Record<Dialect, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic',
  }

  const _dialectName = dialectName[dialect];
  
  if (type === 'arabic') {
    question = `What does ${word} mean in ${_dialectName}? Considering the following sentences:
		Arabic: "${fullSentence.arabic}"
		English: "${fullSentence.english}"
		Transliteration: "${fullSentence.transliteration}"
		
		Please provide a definition based on the context.`;
  } else if (type === 'english') {
    question = `What is the word for "${word}" in ${_dialectName}? Considering the following sentences:
		Arabic: "${fullSentence.arabic}"
		English: "${fullSentence.english}"
		Transliteration: "${fullSentence.transliteration}"
		
		Please provide the Arabic word/phrase and its definition based on the context.`;
  } else {
    question = `What does ${word} mean in ${_dialectName}? Considering the following sentences:
		Arabic: "${fullSentence.arabic}"
		English: "${fullSentence.english}"
		Transliteration: "${fullSentence.transliteration}"
		
		Please provide a definition based on the context.`;
  }

  const res = await fetch('/api/definition-sentence', {
    method: 'POST',
    headers: { accept: 'application/json' },
    body: JSON.stringify({
      question: question
    })
  });

  const data = await res.json();

  // Return in the same format as before for backward compatibility
  // The content will be structured JSON string
  return {
    message: {
      message: {
        content: data.message.content
      }
    }
  };
}