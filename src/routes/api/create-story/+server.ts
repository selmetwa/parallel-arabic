import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request }) => {
  const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
  const data = await request.json();

  const description = data.description;
  const beginner_request = data.option === 'beginner' ? 'Please make the story at least 10 sentences long and use beginner vocabulary' : '';
  const intermediate_request = data.option === 'intermediate' ? 'Please make the story at least 15 sentences long and use intermediate vocabulary' : '';
  const advanced_request = data.option === 'advanced' ? 'Please make the story at least 20 sentences long and use advanced vocabulary' : '';

  let question = `
    Can you please write a short story in Egyptian Arabic for someone who is trying to learn the language.

    Can you please make sure that the story is in the Egyptian dialect, this is EXTREMELY important

    Can you make sure that you generate the sentences in Egyptian arabic, english, and transliteration.

    ${beginner_request}${intermediate_request}${advanced_request}


     Can you make sure that you use a mix of subjects, for example (I, you, he, she, we, they).

    Can you make sure that you use a mix of past, present, and future tenses.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that the output looks like the below object in JSON format:

    {
      title: {arabic: string, english: string},;
      description: {arabic: string, english: string};
      sentences: [];
    }
    where each sentence looks like 

        arabic: {text: string},
        english: { text: string},
        transliteration: {text: string},
  `

  if (description) {
    question += `Can you use ${description} as the theme of the story..`
  }

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
