<script lang="ts">
	import { onMount } from 'svelte';
	import { APP_STORE_URL } from '$lib/constants/app-store';
	import { isNativeApp } from '$lib/helpers/is-native-app';

	interface Props {
		/** Shape/spacing classes, so each page can match its own CTA style. */
		className?: string;
		/** Called before navigating, e.g. to record a banner dismissal. */
		onNavigate?: () => void;
	}

	let { className = '', onNavigate }: Props = $props();

	/**
	 * Rendered server-side so the App Store link is in the HTML, then hidden if
	 * we turn out to be inside the native app — where offering a download of the
	 * app you are already using makes no sense, and where the WebView cannot
	 * follow an apps.apple.com link anyway.
	 */
	let inNativeApp = $state(false);

	onMount(() => {
		inNativeApp = isNativeApp();
	});
</script>

<!--
	No target="_blank" on purpose. apps.apple.com is a Universal Link on iOS, and
	the handoff into the App Store app is unreliable when the link opens a new
	tab — you get the web listing instead. A same-tab link is intercepted by iOS,
	opens the App Store app, and leaves Safari where it was.
-->
{#if !inNativeApp}
	<a
		href={APP_STORE_URL}
		rel="noopener"
		onclick={() => onNavigate?.()}
		class="inline-flex items-center gap-3 bg-tile-500 text-text-300 transition-all duration-200 hover:bg-tile-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 {className}"
	>
		<!--
		The Apple mark is a solid glyph, so it uses fill rather than the
		fill="none" stroke="currentColor" convention the other icons here follow.
	-->
		<svg
			class="h-7 w-7 shrink-0"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M17.05 12.54c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.77 2.29-1.61 2.79-.41 6.92 1.15 9.18.77 1.11 1.68 2.35 2.87 2.3 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.24.88-1.28 1.24-2.53 1.26-2.59-.03-.01-2.41-.92-2.42-3.7ZM14.79 5.6c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.96 2.81 1.02.08 2.06-.51 2.69-1.28Z"
			/>
		</svg>
		<span class="flex flex-col text-left leading-tight">
			<span class="text-[0.65rem] font-medium opacity-80">
				Download on the
			</span>
			<span class="text-lg font-semibold">App Store</span>
		</span>
	</a>
{/if}
