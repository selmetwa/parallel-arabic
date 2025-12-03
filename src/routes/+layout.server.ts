import type { LayoutServerLoad } from './$types'

// Whitelist of emails that have access to all lessons regardless of subscription
const WHITELISTED_EMAILS = [
  'selmetwa@gmail.com',
  'sherifliketheclash@gmail.com'
];

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

    // Check if user is whitelisted first
    const isWhitelisted = user?.email && WHITELISTED_EMAILS.includes(user.email.toLowerCase());
    
    // Compute subscription status inline (no extra DB query)
    const subscriptionEndDate = user?.subscription_end_date ? new Date(user.subscription_end_date) : null;
    const isSubscribed = !!(                         
      isWhitelisted ||                                  // Whitelist check
      user?.is_subscriber ||                           // Primary check: boolean field
      (subscriptionEndDate && new Date() < subscriptionEndDate) // Date check
    );

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