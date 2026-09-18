/**
 * Thin chokepoint for semantic product events. No-op until an analytics
 * provider is wired up again — kept so call sites don't need to change.
 */
export function trackEvent(_event: string, _properties?: Record<string, unknown>) {
	// no-op
}
