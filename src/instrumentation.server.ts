import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://fc150b16531d5ebb97dac534591e4804@o4507759871918080.ingest.us.sentry.io/4511009299562496',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
