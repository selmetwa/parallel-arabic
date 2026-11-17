/**
 * The variety a visitor picked on a landing page before signing up, so
 * onboarding can start on it. Browser-only; storage may be unavailable.
 */
const KEY = 'pa_variety_hint';

export function saveVarietyHint(dialect: string, variety: string): void {
	try {
		localStorage.setItem(KEY, JSON.stringify({ dialect, variety }));
	} catch {
		// Private mode or blocked storage: onboarding just starts blank.
	}
}

export function takeVarietyHint(): { dialect: string; variety: string } | null {
	try {
		const raw = localStorage.getItem(KEY);
		localStorage.removeItem(KEY);
		const hint = raw ? JSON.parse(raw) : null;
		return typeof hint?.dialect === 'string' && typeof hint?.variety === 'string' ? hint : null;
	} catch {
		return null;
	}
}
