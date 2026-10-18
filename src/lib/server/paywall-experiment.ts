/**
 * The hard paywall. It started as a 50/50 test against freemium
 * (docs/paywall-ab-test-plan.md); 'hard' converted about twice as well, so
 * since 2026-10-18 every new signup gets it: 'hard' on the web, 'hard_ios' in
 * the app. A gated user can't use the app until they subscribe or start a trial.
 *
 * The variant is stored on the user row and never changes, so the 'freemium'
 * users from the test keep the free plan.
 */

export type PaywallVariant = 'hard' | 'freemium' | 'hard_ios';

const GATED_VARIANTS: (string | null | undefined)[] = ['hard', 'hard_ios'];

/**
 * Paths a gated user can still reach: the paywall itself, checkout, auth and
 * help, plus /profile, where account deletion lives (App Store 5.1.1(v)).
 */
const EXEMPT_PREFIXES = ['/paywall', '/pricing', '/auth', '/password-reset', '/profile'];
const EXEMPT_PATHS = ['/login', '/signup', '/support', '/privacy'];

export function isPaywallExempt(pathname: string): boolean {
	return (
		EXEMPT_PATHS.includes(pathname) ||
		EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
	);
}

interface GateUser {
	paywall_variant?: string | null;
	onboarding_completed?: boolean | null;
}

/**
 * True for a gated user ('hard' or 'hard_ios') without a subscription or trial. Onboarding has
 * to be complete first, so the onboarding modal and its first conversation
 * still run on the page they signed up on.
 */
export function isPaywalled(user: GateUser, isSubscribed: boolean): boolean {
	return GATED_VARIANTS.includes(user.paywall_variant) && !!user.onboarding_completed && !isSubscribed;
}
