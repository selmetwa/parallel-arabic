import type { LayoutServerLoad } from './$types'
import { checkUserSubscription } from '$lib/helpers/subscription'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies, url }) => {
  try {
    const { session, user } = await safeGetSession()
    
    // Fast path: no user = no subscription
    if (!user) {
      return {
        session,
        user,
        cookies: cookies.getAll(),
        isSubscribed: false,
        dbUser: null,
        showOnboarding: false,
        targetDialect: null
      };
    }

    // Use shared subscription check utility (no extra DB calls)
    const isSubscribed = checkUserSubscription(user);

    // Only show onboarding if:
    // 1. User has newSignup=true query parameter (just signed up)
    // 2. AND onboarding is not completed
    const isNewSignup = url.searchParams.get('newSignup') === 'true'
    const showOnboarding = isNewSignup && !user.onboarding_completed

    return {
      session,
      user: user,  // Database user for backward compatibility
      cookies: cookies.getAll(),
      isSubscribed: isSubscribed,
      showOnboarding: showOnboarding,
      targetDialect: user?.target_dialect || null
    };
  } catch (error) {
    console.error('❌ [+layout.server.ts] Error in layout load:', error)
    console.error('❌ [+layout.server.ts] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Return minimal safe data to prevent complete failure
      return {
        session: null,
        user: null,
        cookies: cookies.getAll(),
        isSubscribed: false,
        dbUser: null,
        showOnboarding: false,
        targetDialect: null
      };
  }
};