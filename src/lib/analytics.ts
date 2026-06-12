import { browser } from '$app/environment';
import posthog from 'posthog-js';

/**
 * Thin client-side wrapper around posthog.capture. Single chokepoint for
 * semantic product events so we don't scatter raw posthog calls, and so
 * analytics can never break the app (SSR-safe + swallows errors).
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
	if (!browser) return;
	try {
		posthog.capture(event, properties);
	} catch {
		// never let analytics break the app
	}
}
