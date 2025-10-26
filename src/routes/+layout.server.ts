import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
  console.log('🔍 [+layout.server.ts] Starting layout load...')
  
  try {
    console.log('🔍 [+layout.server.ts] Calling safeGetSession...')
    const { session, user } = await safeGetSession()
    console.log('🔍 [+layout.server.ts] safeGetSession result:', { 
      hasSession: !!session, 
      hasUser: !!user,
      userEmail: user?.email 
    })
    
    // Fast path: no user = no subscription
    if (!user) {
      console.log('🔍 [+layout.server.ts] No user found, returning early')
      return {
        session,
        user,
        cookies: cookies.getAll(),
        isSubscribed: false,
        dbUser: null
      };
    }

    console.log('🔍 [+layout.server.ts] Computing subscription status...')
    // Compute subscription status inline (no extra DB query)
    const subscriptionEndDate = user?.subscription_end_date ? new Date(user.subscription_end_date) : null;
    const isSubscribed = !!(                         
      user?.is_subscriber ||                           // Primary check: boolean field
      (subscriptionEndDate && new Date() < subscriptionEndDate) // Date check
    );

    console.log('🔍 [+layout.server.ts] Layout load completed successfully:', { isSubscribed })
    return {
      session,
      user: user,  // Database user for backward compatibility
      cookies: cookies.getAll(),
      isSubscribed
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