import type { PageServerLoad } from "./$types";
import { getUserHasActiveSubscription } from "$lib/helpers/get-user-has-active-subscription";
import { db } from '$lib/server/db';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;

  const response = await fetch(`${API_URL}/vocab/verbs`);
	const json = await response.json();
  const tensesViewed = await db.selectFrom('user').select('verb_conjugation_tenses_viewed').where('id', '=', userId ?? '').executeTakeFirst();

  const hasActiveSubscription = await getUserHasActiveSubscription(userId ?? "");

  return {
		words: json.slice(2),
    session,
    hasActiveSubscription,
    tensesViewed: tensesViewed?.verb_conjugation_tenses_viewed ?? 0,
  };
};