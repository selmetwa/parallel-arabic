/**
 * Platform checks for deciding whether to advertise the iOS app.
 *
 * All of these touch `window`/`navigator`, so they must only be called after
 * mount — never during SSR or component initialisation.
 */

/**
 * True when running inside the Capacitor native app.
 *
 * The native app is a thin WebView wrapper that loads the live site
 * (`server.url` in capacitor.config.ts), so anything rendered on the web is
 * also rendered in the app. Without this check, app users get told to download
 * the app they are already using.
 *
 * Sniffs the global Capacitor injects rather than importing @capacitor/core,
 * so the web bundle pays nothing for it. This mirrors the check already inlined
 * in +layout.svelte, +layout.ts, SubscribeButton, login and signup.
 *
 * The build-time CAPACITOR flag is not a substitute: it only picks the adapter,
 * and the shipped app runs the deployed Vercel build.
 */
export function isNativeApp(): boolean {
	if (typeof window === 'undefined') return false;
	return !!(
		window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
	).Capacitor?.isNativePlatform?.();
}

/**
 * True on iPhone/iPad in a browser.
 *
 * iPadOS reports itself as a Mac, so the desktop-Safari user agent has to be
 * disambiguated by touch support.
 */
export function isIosWeb(): boolean {
	if (typeof navigator === 'undefined') return false;

	const ua = navigator.userAgent;
	if (/iPad|iPhone|iPod/.test(ua)) return true;

	return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/** True when launched from the home screen rather than a browser tab. */
export function isStandalone(): boolean {
	if (typeof window === 'undefined') return false;

	return (
		window.matchMedia?.('(display-mode: standalone)').matches ||
		// Non-standard, but it is how iOS Safari reports it.
		(navigator as unknown as { standalone?: boolean }).standalone === true
	);
}
