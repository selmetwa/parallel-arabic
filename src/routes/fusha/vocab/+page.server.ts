import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  // Get session and subscription status from layout (no DB query needed!)
  const { session, isSubscribed } = await parent();

  return {
    session,  // Use from layout!
    hasActiveSubscription: isSubscribed  // Use from layout!
  };
};