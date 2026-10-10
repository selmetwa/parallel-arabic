/**
 * Send the browser's time zone to the server once per user and zone, so
 * streak days and reminders follow the learner's clock. Browser-only.
 */
export function syncTimeZone(userId: string): void {
	let tz: string;
	try {
		tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		return;
	}
	if (!tz) return;

	const key = 'pa-timezone';
	const value = `${userId}:${tz}`;
	try {
		if (localStorage.getItem(key) === value) return;
	} catch {
		// Storage blocked: send it anyway, the server ignores a repeat.
	}

	fetch('/api/timezone', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ timezone: tz })
	})
		.then((res) => {
			if (!res.ok) return;
			try {
				localStorage.setItem(key, value);
			} catch {
				// Nothing to remember it in; it will be sent again next visit.
			}
		})
		.catch(() => {});
}
