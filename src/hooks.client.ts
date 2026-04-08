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

export const handleError = ({ error }: { error: unknown }) => {
	console.error(error);
};
