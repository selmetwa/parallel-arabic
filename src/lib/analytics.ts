/**
 * Thin chokepoint for semantic product events. Onboarding, trial-offer and
 * paywall events are stored in `onboarding_event` so the funnel can be measured;
 * everything else is a no-op until an analytics provider is wired up again.
 */
const RECORDED_PREFIXES = ['onboarding_', 'trial_offer_', 'paywall_'];

export function isRecordedEvent(event: string): boolean {
	return RECORDED_PREFIXES.some((prefix) => event.startsWith(prefix)) && event.length <= 64;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
	if (typeof window === 'undefined' || !isRecordedEvent(event)) return;

	try {
		// keepalive so an event fired just before navigating away still lands.
		fetch('/api/onboarding/event', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ event, props: properties ?? {} }),
			keepalive: true
		}).catch(() => {});
	} catch {
		// Analytics never breaks the page.
	}
}
