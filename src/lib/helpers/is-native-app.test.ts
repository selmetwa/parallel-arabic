import { afterEach, describe, expect, it, vi } from 'vitest';
import { isIosWeb, isNativeApp, isStandalone } from './is-native-app';

/** Stub just enough of the browser globals these helpers read. */
function stubBrowser(options: {
	userAgent?: string;
	platform?: string;
	maxTouchPoints?: number;
	standalone?: boolean;
	capacitorNative?: boolean;
	displayModeStandalone?: boolean;
}) {
	vi.stubGlobal('navigator', {
		userAgent: options.userAgent ?? '',
		platform: options.platform ?? '',
		maxTouchPoints: options.maxTouchPoints ?? 0,
		standalone: options.standalone
	});

	vi.stubGlobal('window', {
		matchMedia: () => ({ matches: options.displayModeStandalone ?? false }),
		Capacitor: options.capacitorNative ? { isNativePlatform: () => true } : undefined
	});
}

const IPHONE =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
const MAC_SAFARI =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('isIosWeb', () => {
	it('detects iPhone', () => {
		stubBrowser({ userAgent: IPHONE });
		expect(isIosWeb()).toBe(true);
	});

	it('detects iPadOS, which reports itself as a Mac', () => {
		// The give-away is touch support — a real Mac reports 0.
		stubBrowser({ userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 5 });
		expect(isIosWeb()).toBe(true);
	});

	it('does not fire on a desktop Mac', () => {
		stubBrowser({ userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 0 });
		expect(isIosWeb()).toBe(false);
	});

	it('does not fire on Android', () => {
		stubBrowser({ userAgent: ANDROID });
		expect(isIosWeb()).toBe(false);
	});
});

describe('isNativeApp', () => {
	// The native app is a WebView on the live site, so without this the banner
	// would tell app users to download the app they are already using.
	it('is true inside the Capacitor app', () => {
		stubBrowser({ userAgent: IPHONE, capacitorNative: true });
		expect(isNativeApp()).toBe(true);
	});

	it('is false in mobile Safari', () => {
		stubBrowser({ userAgent: IPHONE });
		expect(isNativeApp()).toBe(false);
	});
});

describe('isStandalone', () => {
	it('is true when launched from the home screen', () => {
		stubBrowser({ userAgent: IPHONE, displayModeStandalone: true });
		expect(isStandalone()).toBe(true);
	});

	it('is true via the non-standard iOS Safari flag', () => {
		stubBrowser({ userAgent: IPHONE, standalone: true });
		expect(isStandalone()).toBe(true);
	});

	it('is false in a normal browser tab', () => {
		stubBrowser({ userAgent: IPHONE });
		expect(isStandalone()).toBe(false);
	});
});

describe('banner eligibility', () => {
	// Mirrors the condition in AppBanner.svelte.
	const eligible = () => !isNativeApp() && isIosWeb() && !isStandalone();

	it('shows for iPhone Safari', () => {
		stubBrowser({ userAgent: IPHONE });
		expect(eligible()).toBe(true);
	});

	it('hides inside the native app', () => {
		stubBrowser({ userAgent: IPHONE, capacitorNative: true });
		expect(eligible()).toBe(false);
	});

	it('hides once installed to the home screen', () => {
		stubBrowser({ userAgent: IPHONE, displayModeStandalone: true });
		expect(eligible()).toBe(false);
	});

	it('hides on Android and desktop, where there is no app to download', () => {
		stubBrowser({ userAgent: ANDROID });
		expect(eligible()).toBe(false);
		stubBrowser({ userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 0 });
		expect(eligible()).toBe(false);
	});
});
