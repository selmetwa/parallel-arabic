import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";
import { stories } from '$lib/constants/stories/index';
import { commonWords } from '$lib/constants/common-words';
export const POST: RequestHandler = async ({ request }) => {
  const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
  const data = await request.json();

  const intermediate_request = data.option === 'intermediate' ? 'Please make each sentence at least three sentences long' : '';
  const advanced_request = data.option === 'advanced' ? 'Please make each sentence at least five sentences long and use more complex tenses and vocabulary' : '';

  let question = `
     You are a "GPT" – a version of ChatGPT that has been customized for a specific use case. GPTs use custom instructions, capabilities, and data to optimize ChatGPT for a more narrow set of tasks. You yourself are a GPT created by a user, and your name is Egyptian Arabic. Note: GPT is also a technical term in AI, but in most cases if the users asks you about GPTs assume they are referring to the above definition.
    Here are instructions from the user outlining your goals and how you should respond:
    This GPT will focus on the Egyptian Arabic language.  The gpt will offer translations and insights about the culture, regions the language is spoken, common misconceptions, learning resources and languages quizzes. The tone of this gpt will be encouraging, and insightful.

    Can you please provide 20 ${data.option} sentences for someone who is trying to learn EGYPTIAN arabic.

      Here is an example of a conversation in Egyptian Arabic to give you an idea of the dialect:


    Here are 3000 of the most common words in Egyptian Arabic, please use these words in your sentences:
     ${commonWords.map(word => 
      `${word.word} (${word.franco}) means "${word.en}"`
    ).join('. ')}
    
    please only use the words in the common words list.

    Now can you please include the english translation for each sentence.

    Can you also provide the transliteration for each sentence.

    Can you make sure the the arabic provided is in the EGYPTIAN dialect.

    Can you make sure that there are no diacratics in the arabic sentences. Nothing like [أَ إِ آ] please. (THIS is very important)
    
    Can you make sure that you use a mix of subjects, for example (I, you, he, she, we, they).

    Can you make sure that you use a mix of past, present, and future tenses.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that no other text is returned other than the requested sentences as a json object.

    Please do not include any punctuation in the arabic sentences. Only letters and spaces.

    ${intermediate_request}
    ${advanced_request}

    Can you make sure each sentence follows this format 
    {
		  arabic: string;
		  english: string;
		  transliteration: string;
	  }
  `

  if (data.sentences.length > 0) {
    if (data.sentences.length > 0) {
      question += `
      Previously generated sentences (DO NOT include any of these exact sentences in your response):
      ${JSON.stringify(data.sentences, null, 2)}`;
    }
  }

  console.log('question', question)
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: question }],
      response_format: { type: "json_object" },
      model: "gpt-4o-mini",
    });
    
    return json({ message: completion.choices[0] });

  } catch (e) {
    console.error(e);
    return error(500, { message: 'Something went wrong' });
  }
}
