import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request, locals }) => {
  const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });

  const data = await request.json();
  console.log(data);

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: data.question }],
      model: "gpt-4o-mini",
    });
  
    console.log(completion.choices[0]);
    return json({ message: completion.choices[0] });

  } catch (e) {
    console.error(e);
    return error(500, { message: 'Something went wrong' });
  }
}
