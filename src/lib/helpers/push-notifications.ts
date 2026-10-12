/**
 * Push notifications in the iOS app. Everything here is a no-op on the web.
 *
 * The app loads the live site, so this code also reaches binaries built before
 * the push plugin was added. There the plugin calls reject, and pushPermission()
 * reports 'unavailable'.
 */
import { goto } from '$app/navigation';
import { isNativeApp } from '$lib/helpers/is-native-app';

export type PushPermission = 'granted' | 'denied' | 'prompt' | 'unavailable';

let listening = false;

async function plugin() {
	return (await import('@capacitor/push-notifications')).PushNotifications;
}

export async function pushPermission(): Promise<PushPermission> {
	if (!isNativeApp()) return 'unavailable';

	try {
		const { receive } = await (await plugin()).checkPermissions();
		if (receive === 'granted' || receive === 'denied') return receive;
		return 'prompt';
	} catch {
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
			}).catch((err) => console.error('Failed to save push token:', err));
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
	const { receive } = await (await plugin()).requestPermissions();
	if (receive !== 'granted') return false;

	await registerForPush();
	return true;
}
