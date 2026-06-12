import posthog from 'posthog-js';
import { PUBLIC_POSTHOG_PROJECT_TOKEN } from '$env/static/public';
import type { HandleClientError } from '@sveltejs/kit';

// import * as Sentry from '@sentry/sveltekit';
// import { PUBLIC_SENTRY_DSN } from '$env/static/public';

// Sentry.init({
// 	dsn: PUBLIC_SENTRY_DSN ?? PUBLIC_SENTRY_DSN,
// 	environment: import.meta.env.MODE,
// 	sendDefaultPii: true,
// 	tracesSampleRate: 1.0,

// 	integrations: [
// 		Sentry.replayIntegration({
// 			maskAllText: true,
// 			blockAllMedia: true
// 		})
// 	],

// 	replaysSessionSampleRate: 0.1,
// 	replaysOnErrorSampleRate: 1.0
// });
// console.log('[Sentry] DSN present:', !!import.meta.env.PUBLIC_SENTRY_DSN);

export async function init() {
	posthog.init(PUBLIC_POSTHOG_PROJECT_TOKEN, {
		api_host: '/ingest',
		ui_host: 'https://us.posthog.com',
		defaults: '2026-01-30',
		capture_exceptions: true
	});
}

export const handleError: HandleClientError = async ({ error, status, message }) => {
	posthog.captureException(error);
	console.error(error);
	return { message, status };
};
