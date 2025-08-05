import { getUserHasActiveSubscription } from "$lib/helpers/get-user-has-active-subscription";
import { db } from '$lib/server/db';

export const load = async ({ locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;

  const hasActiveSubscription = await getUserHasActiveSubscription(userId ?? "");
  const user_generated_stories = await db
    .selectFrom('generated_story')
    .selectAll()
    .where('dialect', '=', 'iraqi')
    .orderBy('created_at', 'desc')
    .execute();

  return {
    hasActiveSubscription,
    user_generated_stories
  }
}; 