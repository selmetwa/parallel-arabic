import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.auth.validate();

  const userId = session?.user.userId;
  const sentencesViewed = await db.selectFrom('user').select('verb_conjugation_tenses_viewed').where('id', '=', userId || '').executeTakeFirst();
  const newTensesViewed = (sentencesViewed?.verb_conjugation_tenses_viewed ?? 0) + 1;

  const result = await db
    .updateTable('user')
    .set('verb_conjugation_tenses_viewed', newTensesViewed)
    .where('id', '=', userId || '').execute();
  
    console.log("tenses updated: ", {result});

    return json({ tensesViewed: newTensesViewed });
}
