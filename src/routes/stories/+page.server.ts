import { getUserHasActiveSubscription } from "$lib/helpers/get-user-has-active-subscription";

export const load = async ({ locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;

  const hasActiveSubscription = await getUserHasActiveSubscription(userId ?? "");

  return {
    hasActiveSubscription
  }
};