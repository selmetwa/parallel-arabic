<script lang="ts" module>
	declare global {
		interface Window {
			turnstile?: {
				render: (el: HTMLElement, options: Record<string, unknown>) => string;
				reset: (widgetId: string) => void;
				remove: (widgetId: string) => void;
			};
		}
	}

	let scriptPromise: Promise<void> | null = null;

	function loadScript(): Promise<void> {
		scriptPromise ??= new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => {
				scriptPromise = null;
				reject(new Error('Failed to load Turnstile'));
			};
			document.head.appendChild(script);
		});
		return scriptPromise;
	}
</script>

<script lang="ts">
	// Cloudflare Turnstile widget. Posts its token as `captchaToken` with the
	// surrounding form; the server action hands it to Supabase Auth.
	import { env } from '$env/dynamic/public';

	// `verified` is true once there's a token to submit (or always, when no site key is set).
	let { verified = $bindable() }: { verified?: boolean } = $props();

	let container: HTMLDivElement | undefined = $state();
	let widgetId: string | null = null;
	let token = $state('');

	const siteKey = env.PUBLIC_TURNSTILE_SITE_KEY;
	verified = !siteKey;

	function setToken(t: string) {
		token = t;
		verified = !!t;
	}

	$effect(() => {
		if (!siteKey) return;
		let cancelled = false;

		loadScript()
			.then(() => {
				if (cancelled || !container || !window.turnstile) return;
				widgetId = window.turnstile.render(container, {
					sitekey: siteKey,
					size: 'flexible',
					'response-field': false,
					callback: (t: string) => setToken(t),
					'expired-callback': () => setToken(''),
					'error-callback': () => setToken('')
				});
			})
			.catch((error) => console.error(error));

		return () => {
			cancelled = true;
			if (widgetId) window.turnstile?.remove(widgetId);
			widgetId = null;
		};
	});

	// Tokens are single-use, so get a fresh one after every submit.
	export function reset() {
		if (!widgetId) return;
		setToken('');
		window.turnstile?.reset(widgetId);
	}
</script>

{#if siteKey}
	<div bind:this={container} class="mb-4"></div>
	<input type="hidden" name="captchaToken" value={token} />
{/if}
