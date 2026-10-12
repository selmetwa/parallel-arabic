import { isNativeApp } from '$lib/helpers/is-native-app';

/**
 * Asks iOS to show its rating prompt. Call it right after a win.
 *
 * Apple decides whether the prompt actually appears (at most three times a
 * year per user, and never if they turned it off), so this is safe to call
 * more than once.
 *
 * The app loads the live site, so this code also reaches binaries built before
 * the review plugin was added. There the call rejects, and nothing happens.
 */
export async function requestAppReview(): Promise<void> {
	if (!isNativeApp()) return;

	try {
		const { InAppReview } = await import('@capacitor-community/in-app-review');
		await InAppReview.requestReview();
	} catch {
		// Older binary without the plugin.
	}
}
