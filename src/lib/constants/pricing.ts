/**
 * Stripe (web) plans. The annual plan is web-only: the iOS app sells the
 * monthly plan through Apple, so never render annual copy inside the WebView.
 * Price IDs live in STRIPE_MONTHLY_PRICE_ID / STRIPE_ANNUAL_PRICE_ID.
 */
export type PlanId = 'monthly' | 'annual';

export const PLANS = {
	monthly: { label: 'Monthly', price: '$10/month' },
	annual: { label: 'Annual', price: '$96/year', perMonth: '$8/mo', savings: 'Save 20%' }
} as const;

export function isPlanId(value: unknown): value is PlanId {
	return value === 'monthly' || value === 'annual';
}
