import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request }) => {
  const openai = new OpenAI({ apiKey: env['open_ai_key'] });
  const data = await request.json();

  let question = `
    Can you please provide 20 ${data.option} sentences for someone who is trying to learn EGYPTIAN arabic.

    Now can you please include the english translation for each sentence.

    Can you also provide the transliteration for each sentence.

    Can you make sure the the arabic provided is in the EGYPTIAN dialect.

    Can you make sure that there are no diacratics in the arabic sentences. Nothing like [أَ إِ آ] please.
    
    Can you make sure that you use a mix of subjects, for example (I, you, he, she, we, they).

    Can you make sure that you use a mix of past, present, and future tenses.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that no other text is returned other than the requested sentences as a json object.

    Please do not include any punctuation in the arabic sentences. Only letters and spaces.
  `

  if (data.sentences.length > 0) {
    question += `Please do not include any of the following sentences in the response: ${data.sentences.join(', ')}.`
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
