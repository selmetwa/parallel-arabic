import { v4 as uuidv4 } from 'uuid';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '../../../lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
	const session = await locals.auth.validate();
  const userId = session?.user.userId;
  const wordId = uuidv4();

  const wordExists = await db
    .selectFrom('saved_word')
    .selectAll()
    .where('arabic_word', '=', data.activeWordObj.arabic)
    .where('user_id', '=', userId || '')
    .executeTakeFirst();

  if (wordExists) {
    return json({ message: 'You have already saved this word' });
  }

  try {
    await db.insertInto('saved_word')
    .values({
      id: wordId,
      user_id: userId || '',
      arabic_word: data.activeWordObj.arabic || '',
      english_word: data.activeWordObj.english || '',
      transliterated_word: data.activeWordObj.transliterated || '',
      created_at: new Date().getTime()
    }).executeTakeFirst();

    return json({ message: 'Word saved' });
  } catch (e) {
    return error(500, { message: 'Something went wrong' });
  }
}
