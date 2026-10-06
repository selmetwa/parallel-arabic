<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	/**
	 * Tells signed-in users about Scenarios, once, in a modal (desktop, phones
	 * and the app alike). "Once" is per browser (localStorage), and visiting
	 * /scenarios counts as having seen it.
	 */
	interface Props {
		signedIn: boolean;
	}

	let { signedIn }: Props = $props();

	const SEEN_KEY = 'pa-scenarios-announced';
	/** Long enough that it never interrupts the page loading. */
	const DELAY_MS = 5000;
	/** Pages where a prompt would get in the way of something else. */
	const QUIET_PREFIXES = [
		'/scenarios',
		'/learn/game/scenarios',
		'/paywall',
		'/pricing',
		'/login',
		'/signup',
		'/auth',
		'/password-reset'
	];

	let open = $state(false);

	function seen(): boolean {
		try {
			return localStorage.getItem(SEEN_KEY) === '1';
		} catch {
			return true; // Storage unavailable: don't nag on every page.
		}
	}

	function markSeen() {
		try {
			localStorage.setItem(SEEN_KEY, '1');
		} catch {
			// Only this visit knows.
		}
	}

	const quiet = () => QUIET_PREFIXES.some((p) => page.url.pathname.startsWith(p));

	// Going to the page is as good as seeing the prompt.
	$effect(() => {
		if (page.url.pathname.startsWith('/scenarios')) markSeen();
	});

	onMount(() => {
		if (!signedIn || seen()) return;
		const timer = setTimeout(() => {
			if (seen() || quiet()) return;
			markSeen();
			open = true;
		}, DELAY_MS);
		return () => clearTimeout(timer);
	});

	function close() {
		open = false;
	}

	function onkeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close();
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<div class="backdrop" transition:fade={{ duration: 150 }} onclick={close} aria-hidden="true"></div>
	<div
		class="dialog"
		role="dialog"
		aria-modal="true"
		aria-labelledby="scenarios-announcement-title"
		transition:scale={{ start: 0.96, duration: 180 }}
	>
		<img
			src="/images/feature-pages/game-scenarios.webp"
			width="2560"
			height="1440"
			alt="A Scenarios conversation at a market stall, with the seller's question and your replies"
			class="shot"
		/>
		<div class="body">
			<span class="badge">New</span>
			<h2 id="scenarios-announcement-title">Try a real conversation in Arabic</h2>
			<p>
				Step into a taxi, a market, a pharmacy or a hotel. Someone talks to you in your dialect, and
				you answer by tapping a reply or saying it out loud. What you ask for actually happens.
			</p>
			<p class="scenes" aria-hidden="true">🍽️ 🚕 🍅 💊 🛎️</p>
			<div class="actions">
				<!-- svelte-ignore a11y_autofocus -->
				<a href={resolve('/scenarios')} class="primary" onclick={close} autofocus>
					Try a conversation <span aria-hidden="true">→</span>
				</a>
				<button type="button" class="secondary" onclick={close}>Maybe later</button>
			</div>
		</div>
		<button type="button" class="close" onclick={close} aria-label="Close">✕</button>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 900;
		background: rgb(0 0 0 / 0.45);
	}

	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		z-index: 901;
		width: min(30rem, calc(100% - 2rem));
		max-height: calc(100dvh - 2rem);
		overflow-y: auto;
		translate: -50% -50%;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		box-shadow: 0 24px 60px rgb(0 0 0 / 0.3);
	}

	.shot {
		display: block;
		width: 100%;
		height: auto;
		border-bottom: 2px solid var(--tile5);
	}

	.body {
		display: grid;
		gap: 0.6rem;
		justify-items: start;
		padding: 1.1rem 1.3rem 1.3rem;
	}

	.badge {
		padding: 0.15rem 0.6rem;
		border-radius: 100px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #fff;
		background: #0ea5e9;
	}

	h2 {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	p {
		font-size: 0.93rem;
		line-height: 1.5;
		color: var(--text2);
	}

	.scenes {
		font-size: 1.35rem;
		letter-spacing: 0.25rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.9rem;
		margin-top: 0.3rem;
	}

	.primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.75rem;
		padding: 0.6rem 1.2rem;
		border-radius: 1rem;
		font-weight: 600;
		color: #fff;
		background: #0ea5e9;
		box-shadow: 0 4px 0 #0369a1;
		text-decoration: none;
	}

	.primary:active {
		translate: 0 3px;
		box-shadow: 0 1px 0 #0369a1;
	}

	.secondary {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.close {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 50%;
		color: #fff;
		background: rgb(0 0 0 / 0.5);
		cursor: pointer;
	}
</style>
