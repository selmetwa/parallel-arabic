import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
  try {
    const { session, user } = await safeGetSession()
    
    // Fast path: no user = no subscription
    if (!user) {
      return {
        session,
        user,
        cookies: cookies.getAll(),
        isSubscribed: false,
        dbUser: null
      };
    }

    // Compute subscription status inline (no extra DB query)
    const subscriptionEndDate = user?.subscription_end_date ? new Date(user.subscription_end_date) : null;
    const isSubscribed = !!(                         
      user?.is_subscriber ||                           // Primary check: boolean field
      (subscriptionEndDate && new Date() < subscriptionEndDate) // Date check
    );

    return {
      session,
      user: user,  // Database user for backward compatibility
      cookies: cookies.getAll(),
      isSubscribed: isSubscribed
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
      dbUser: null
    };
  }
};