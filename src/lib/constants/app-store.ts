/**
 * The iOS app listing. Single source of truth — referenced from /mobile-app,
 * /about and the mobile download banner.
 *
 * There is no Android app: no Play Store listing exists, and the `cap:android`
 * scripts and @capacitor/android dependency are scaffolding that was never
 * used. Copy that mentions app availability should say iPhone and iPad only.
 */
export const APP_STORE_ID = '6761313327';

/**
 * Deliberately has no country segment.
 *
 * An `/us/` path sends everyone to the US storefront; visitors elsewhere get a
 * redirect at best and a storefront-switch prompt at worst. The locale-less
 * form resolves to whichever storefront the visitor is signed in to. That
 * matters here — over half of search impressions come from outside the US
 * (UK, UAE, Egypt, Canada, India, Germany, Australia), and the app is live in
 * all of them.
 *
 * On iOS this is a Universal Link: tapping it hands off to the App Store app
 * rather than opening the web listing. That handoff is why links to it should
 * not carry target="_blank" — see AppStoreBadge.
 */
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

/**
 * Apple's provider token: the numeric `pt` value from App Store Connect's
 * campaign link generator (App Analytics → Acquisition → Generate Campaign
 * Link). It is public, and the same for every campaign.
 */
export const APP_STORE_PROVIDER_TOKEN = '128686021';

/** Every place the site links to the listing. Shows up as the campaign in App Store Connect. */
export type AppStoreCampaign =
	| 'web-banner'
	| 'mobile-app-hero'
	| 'mobile-app-footer'
	| 'about-hero'
	| 'about-footer';

/** The listing link, tagged so App Store Connect can attribute installs to a placement. */
export function appStoreUrl(
	campaign: AppStoreCampaign,
	providerToken: string = APP_STORE_PROVIDER_TOKEN
): string {
	if (!providerToken) return APP_STORE_URL;
	return `${APP_STORE_URL}?pt=${providerToken}&ct=${campaign}&mt=8`;
}
