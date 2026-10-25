/**
 * Thin chokepoint for semantic product events. Onboarding, trial-offer,
 * paywall, game and cancel-flow events are stored in `onboarding_event` so the funnel can be
 * measured (game events from signed-out visitors go to `anon_event`);
 * everything else is a no-op until an analytics provider is wired up again.
 */
const RECORDED_PREFIXES = ['onboarding_', 'trial_offer_', 'paywall_', 'game_', 'cancel_'];

/** The only events a signed-out visitor can record. */
export function isAnonEvent(event: string): boolean {
	return event.startsWith('game_');
}

export function isRecordedEvent(event: string): boolean {
	return RECORDED_PREFIXES.some((prefix) => event.startsWith(prefix)) && event.length <= 64;
}

const ANON_ID_KEY = 'pa-anon-id';

/** A random id for this browser, so signed-out events can be tied together. */
export function anonId(): string | null {
	try {
		let id = localStorage.getItem(ANON_ID_KEY);
		if (!id) {
			id = crypto.randomUUID();
			localStorage.setItem(ANON_ID_KEY, id);
		}
		return id;
	} catch {
		return null;
	}
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
	if (typeof window === 'undefined' || !isRecordedEvent(event)) return;

	try {
		// keepalive so an event fired just before navigating away still lands.
		fetch('/api/onboarding/event', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				event,
				props: properties ?? {},
				...(isAnonEvent(event) && { anonId: anonId() })
			}),
			keepalive: true
		}).catch(() => {});
	} catch {
		// Analytics never breaks the page.
	}
}
