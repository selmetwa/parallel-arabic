import { describe, expect, it } from 'vitest';
import { APP_STORE_ID, APP_STORE_URL, appStoreUrl } from './app-store';

describe('APP_STORE_URL', () => {
	it('carries no country segment', () => {
		// A hardcoded storefront (/us/, /gb/, …) sends everyone to that country's
		// store. Most of our search traffic is not from the US, so the URL must
		// stay locale-less and let Apple resolve the visitor's own storefront.
		expect(APP_STORE_URL).not.toMatch(/apps\.apple\.com\/[a-z]{2}\//);
	});

	it('is an https apps.apple.com URL, which is what makes it a Universal Link', () => {
		// itms-apps:// would force the App Store app but breaks on desktop and
		// Android. https://apps.apple.com deep-links on iOS and degrades to the
		// web listing everywhere else.
		expect(APP_STORE_URL.startsWith('https://apps.apple.com/')).toBe(true);
	});

	it('points at the right app', () => {
		expect(APP_STORE_ID).toBe('6761313327');
		expect(APP_STORE_URL).toContain(`id${APP_STORE_ID}`);
	});
});

describe('appStoreUrl', () => {
	it('tags the link with the provider token and placement', () => {
		expect(appStoreUrl('web-banner', '123456')).toBe(
			`${APP_STORE_URL}?pt=123456&ct=web-banner&mt=8`
		);
	});

	it('falls back to the bare link without a provider token', () => {
		// Apple drops a campaign name that has no provider token alongside it.
		expect(appStoreUrl('web-banner', '')).toBe(APP_STORE_URL);
	});
});
