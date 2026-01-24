import { type Dialect } from '$lib/types/index';

type TFullSentence = {
  english: string;
  arabic: string;
  transliteration: string;
}

const dialectName: Record<Dialect, string> = {
  fusha: 'Modern Standard Arabic',
  levantine: 'Levantine Arabic',
  darija: 'Moroccan Darija',
  'egyptian-arabic': 'Egyptian Arabic',
  iraqi: 'Iraqi Arabic',
  khaleeji: 'Khaleeji Arabic'
}

export const askChatGTP = async (word: string, type: string, fullSentence: TFullSentence, dialect: Dialect) => {
  let question = '';

  const _dialectName = dialectName[dialect] || dialect;

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

  try {
    const res = await fetch('/api/definition-sentence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        question: question
      })
    });

    if (!res.ok) {
      console.error('Definition API error:', res.status);
      return {
        message: {
          message: {
            content: 'Failed to load definition. Please try again.'
          }
        }
      };
    }

    const data = await res.json();

    // Return in the same format as before for backward compatibility
    // The content will be structured JSON string
    return {
      message: {
        message: {
          content: data.message?.content || 'No definition available'
        }
      }
    };
  } catch (error) {
    console.error('Error fetching definition:', error);
    return {
      message: {
        message: {
          content: 'Error loading definition. Please try again.'
        }
      }
    };
  }
}