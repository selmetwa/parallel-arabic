import { json } from '@sveltejs/kit';

/**
 * Tells iOS that links to this site belong to the app (Universal Links), so a
 * tap in search results, email or social opens the app when it is installed.
 * The other half is the Associated Domains entitlement in the Xcode project.
 *
 * A route rather than a static file because Apple wants this extensionless
 * path served as JSON.
 */
const association = {
	applinks: {
		details: [
			{
				// <Apple Team ID>.<bundle ID>
				appIDs: ['KY47LR49D8.com.parallelarabic.app'],
				components: [
					// Sign-in and password-reset links must finish in the browser that started them.
					{ '/': '/auth/*', exclude: true },
					{ '/': '/api/*', exclude: true },
					// Stripe sends web checkouts back here.
					{ '/': '/pricing/subscribed*', exclude: true },
					{ '/': '*' }
				]
			}
		]
	}
};

export function GET() {
	return json(association);
}
