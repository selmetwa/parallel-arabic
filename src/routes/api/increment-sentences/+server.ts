import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.auth.validate();

  const userId = session?.user.userId;
  const sentencesViewed = await db.selectFrom('user').select('sentences_viewed').where('id', '=', userId || '').executeTakeFirst();
  const newSentencesViewed = (sentencesViewed?.sentences_viewed ?? 0) + 1;

  const result = await db
    .updateTable('user')
    .set('sentences_viewed', newSentencesViewed)
    .where('id', '=', userId || '').execute();
  
    console.log({result});

    return json({ sentencesViewed: newSentencesViewed });
}
