import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  // Get session and subscription info from parent layout
  const { session, isSubscribed, user } = await parent();

  return {
    session,
    isSubscribed,
    hasActiveSubscription: isSubscribed, // Keep for backward compatibility
    user
  };
};

