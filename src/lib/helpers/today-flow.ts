/**
 * Whether the learner came from today's path, so the end screens of review,
 * lessons and games can offer the next step. Kept in sessionStorage for the
 * day: lesson and game pages rewrite their URLs, so a query param would get lost.
 */
const KEY = 'todayFlow';

const today = () => new Date().toDateString();

export function startTodayFlow(): void {
	try {
		sessionStorage.setItem(KEY, today());
	} catch {
		// No storage: the end screens just won't offer the next step.
	}
}

export function inTodayFlow(): boolean {
	try {
		return sessionStorage.getItem(KEY) === today();
	} catch {
		return false;
	}
}

export function endTodayFlow(): void {
	try {
		sessionStorage.removeItem(KEY);
	} catch {
		// Nothing to clear.
	}
}

/** True the first time this is called for today's date on this device. */
export function firstTimeToday(name: string): boolean {
	try {
		const key = `${name}:${today()}`;
		if (localStorage.getItem(key)) return false;
		localStorage.setItem(key, '1');
		return true;
	} catch {
		return false;
	}
}
