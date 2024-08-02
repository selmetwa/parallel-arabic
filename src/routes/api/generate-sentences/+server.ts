import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";

export const GET: RequestHandler = async () => {
  const openai = new OpenAI({ apiKey: env['open_ai_key'] });

  const question = `
    Can you please provide 10 sentences for someone who is trying to learn the english language.

    Now can you please include the egyptian arabic translation for each sentence.

    Can you also provide the transliteration for each sentence.

    Can you make sure the the arabic provided is in the egyptian dialect.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that no other text is returned other than the requested sentences as a json object.
  `
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: question }],
      response_format: { type: "json_object" },
      model: "gpt-4o-mini",
    });
    
    console.log(completion.choices[0]);
    return json({ message: completion.choices[0] });

  } catch (e) {
    console.error(e);
    return error(500, { message: 'Something went wrong' });
  }
}
