import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { getUserContext } from '$lib/server/user-context'
import { checkUserSubscription } from '$lib/helpers/subscription'
import { isPaywalled, isPaywallExempt } from '$lib/server/paywall-experiment'

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
  // Paywall A/B test. Outside the try so the catch can't swallow the redirect.
  // url.pathname is only read for paywalled users: reading it makes SvelteKit
  // rerun this load on every client-side navigation.
  if (
    locals.user &&
    isPaywalled(locals.user, checkUserSubscription(locals.user)) &&
    !isPaywallExempt(url.pathname)
  ) {
    redirect(303, '/paywall')
  }

  try {
    const { session, user } = locals
    
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

    // Only show onboarding if:
    // 1. User has newSignup=true query parameter (just signed up)
    // 2. AND onboarding is not completed
    const isNewSignup = url.searchParams.get('newSignup') === 'true'
    const showOnboarding = isNewSignup && !user.onboarding_completed

    console.log({ user })
    return {
      session,
      user: user,  // Database user for backward compatibility
      cookies: cookies.getAll(),
      showOnboarding: showOnboarding,
      // Subscription, trial, XP and dialect fields (shared with /api/me)
      ...getUserContext(user)
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