/**
 * Push notifications in the iOS app. Everything here is a no-op on the web.
 *
 * The app loads the live site, so this code also reaches binaries built before
 * the push plugin was added. There the plugin calls reject, and pushPermission()
 * reports 'unavailable'.
 */
import { goto } from '$app/navigation';
import { isNativeApp } from '$lib/helpers/is-native-app';
import { trackEvent } from '$lib/analytics';

export type PushPermission = 'granted' | 'denied' | 'prompt' | 'unavailable';

let listening = false;

// Diagnostics: no app user has ever registered a device, so record each step.
const errorText = (err: unknown) => String((err as Error)?.message ?? err).slice(0, 300);

async function plugin() {
	return (await import('@capacitor/push-notifications')).PushNotifications;
}

/** localStorage key holding when the "turn on reminders" banner may ask again. */
export const PUSH_PROMPT_SNOOZE_KEY = 'pushPromptSnoozedUntil';

/** Stop the reminder banner asking for this long (ms). */
export function snoozePushPrompt(ms: number): void {
	try {
		localStorage.setItem(PUSH_PROMPT_SNOOZE_KEY, String(Date.now() + ms));
	} catch {
		// Private mode: the banner may ask again, which is harmless.
	}
}

export async function pushPermission(): Promise<PushPermission> {
	if (!isNativeApp()) return 'unavailable';

	try {
		const { receive } = await (await plugin()).checkPermissions();
		trackEvent('push_permission_checked', { receive });
		if (receive === 'granted' || receive === 'denied') return receive;
		return 'prompt';
	} catch (err) {
		trackEvent('push_permission_checked', { receive: 'error', error: errorText(err) });
		return 'unavailable';
	}
}

/**
 * Gets this device's token from Apple and saves it against the signed-in
 * user. Call on every launch once permission is granted: tokens change.
 */
export async function registerForPush(): Promise<void> {
	const PushNotifications = await plugin();

	if (!listening) {
		listening = true;

		await PushNotifications.addListener('registration', ({ value }) => {
			fetch('/api/push/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: value })
			})
				.then((res) => trackEvent('push_token_saved', { status: res.status }))
				.catch((err) => {
					console.error('Failed to save push token:', err);
					trackEvent('push_token_saved', { status: 'error', error: errorText(err) });
				});
		});

		await PushNotifications.addListener('registrationError', ({ error }) => {
			trackEvent('push_registration_failed', { error: errorText(error) });
		});

		// Tapping a notification opens the page it was about.
		await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
			const url = notification.data?.url;
			if (typeof url === 'string' && url.startsWith('/')) goto(url);
		});
	}

	await PushNotifications.register();
}

/** Shows the iOS permission dialog. True if the learner allowed notifications. */
export async function enablePush(): Promise<boolean> {
	let receive: string;
	try {
		({ receive } = await (await plugin()).requestPermissions());
	} catch (err) {
		trackEvent('push_permission_answered', { receive: 'error', error: errorText(err) });
		throw err;
	}
	trackEvent('push_permission_answered', { receive });
	if (receive !== 'granted') return false;

	try {
		await registerForPush();
	} catch (err) {
		trackEvent('push_registration_failed', { error: errorText(err) });
		throw err;
	}
	return true;
}
