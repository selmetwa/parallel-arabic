import { db } from '$lib/server/db';
import { getUserHasActiveSubscription } from "$lib/helpers/get-user-has-active-subscription";

export const load  = async ({ locals }) => {
  const session = await locals.auth.validate();

  const userId = session && session.user.userId || null;
  const user = await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();
  const isSubscribed = await getUserHasActiveSubscription(userId ?? "");

  return {
    session,
    isSubscribed,
    user
  };
}