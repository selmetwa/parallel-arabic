import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";

export const POST: RequestHandler = async ({ request, locals }) => {
  const openai = new OpenAI({ apiKey: env['open_ai_key'] });

  const session = await locals.auth.validate();

  if (!session) {
    return error(401, { message: 'You must have an account do that' });
  }

  const data = await request.json();

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: data.question }],
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
