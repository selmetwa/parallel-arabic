import { env } from '$env/dynamic/private';

/**
 * Hard paywall vs freemium A/B test (docs/paywall-ab-test-plan.md).
 *
 * New web signups are split 50/50 when they finish onboarding. The 'hard'
 * group can't use the app until they subscribe or start a trial; 'freemium'
 * gets the app as it is today. The variant is stored on the user row, so it
 * never changes, and turning the experiment off only stops new assignments.
 */

export type PaywallVariant = 'hard' | 'freemium';

/** Read at runtime so the test can be stopped from Vercel without a rebuild. */
export function isExperimentOn(): boolean {
	return env.PAYWALL_EXPERIMENT === 'on';
}

export function assignVariant(): PaywallVariant {
	return Math.random() < 0.5 ? 'hard' : 'freemium';
}

/** Paths a gated user can still reach: the paywall itself, checkout, auth and help. */
const EXEMPT_PREFIXES = ['/paywall', '/pricing', '/auth', '/password-reset'];
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
 * True for a hard-group user without a subscription or trial. Onboarding has
 * to be complete first, so the onboarding modal and its first conversation
 * still run on the page they signed up on.
 */
export function isPaywalled(user: GateUser, isSubscribed: boolean): boolean {
	return user.paywall_variant === 'hard' && !!user.onboarding_completed && !isSubscribed;
}
