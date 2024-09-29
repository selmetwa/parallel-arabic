import { redirect } from '@sveltejs/kit';
import type { PageServerLoad} from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, '/login');
  }

  const userId = session && session.user.userId || null;
  const user = await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();
  const savedWords = await db.selectFrom('saved_word').selectAll().where('user_id', '=', userId).execute();
  const adminEmails = ["sherifliketheclash@gmail.com", "selmetwa@gmail.com"]

  const usersWithSavedWords = await db
  .selectFrom('user')
  .leftJoin('saved_word', 'user.id', 'saved_word.user_id')
  .select(['user.email', 'user.id', 'user.is_subscriber', 'user.sentences_viewed', 'user.verb_conjugation_tenses_viewed', 'saved_word.id as saved_word_id']) // Select all user columns and the saved word
  .execute();

   const users = usersWithSavedWords.reduce((acc, row) => {
   const user = acc.find(u => u.id === row.id);

  if (user) {
    if (row.saved_word_id) {
      user.savedWords.push(row.saved_word_id); // Add the word if the user already exists
    }
  } else {
    acc.push({
      id: row.id,
      email: row.email,
      is_subscriber: row.is_subscriber,
      verb_conjugation_tenses_viewed: row.verb_conjugation_tenses_viewed,
      sentences_viewed: row.sentences_viewed,
      savedWords: row.saved_word_id ? [row.saved_word_id] : [], // Initialize with the word
    });
  }

  return acc;
}, []);

  if (!adminEmails.includes(user?.email ?? '')) {
    throw redirect(302, '/')
  }

	return {
		user,
    users,
    savedWordsCount: savedWords.length
	};
};


