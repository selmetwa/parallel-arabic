<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import PressButton from './PressButton.svelte';
	import ScenarioPlayer from './ScenarioPlayer.svelte';
	import type { RoundGate } from '$lib/games/free-rounds.svelte';
	import type { GameDialect } from '$lib/games/themes';
	import type { Level } from '$lib/games/room-hunt/round';
	import { stopClip } from '$lib/games/room-hunt/audio';
	import type { RoomScene } from '$lib/games/room-hunt/scene';
	import type { ScenarioEntry } from '$lib/games/room-hunt/scenarios/index';

	interface Props {
		entry: ScenarioEntry;
		dialect: GameDialect;
		level: Level;
		gate: RoundGate;
		signedIn: boolean;
		isSubscribed: boolean;
		accent: string;
		deep: string;
	}

	let { entry, dialect, level, gate, signedIn, isSubscribed, accent, deep }: Props = $props();

	const scenario = untrack(() => entry.scenario);
	const stage = untrack(() => entry.stage);

	let container = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	// $state.raw: reactive, but three.js objects must not be deep-proxied.
	let scene = $state.raw<RoomScene | null>(null);
	let progress = $state(0);
	let loading = $state(true);
	let failed = $state(false);

	let playing = $state(false);
	/** Fullscreen, first-person, while a conversation runs. */
	let immersive = $state(false);
	/** Bumped each time, so "Again" starts the scene fresh. */
	let run = $state(0);
	let runProgress = $state('');
	let muted = $state(false);
	let showTranslit = $state(true);

	const translit = $derived(level === 'easy' || (level === 'normal' && showTranslit));

	onMount(() => {
		let disposed = false;
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		try {
			muted = localStorage.getItem('pa-room-hunt-muted') === '1';
		} catch {
			// Sound stays on.
		}

		import('$lib/games/room-hunt/scene')
			.then(({ createRoomScene }) => createRoomScene(canvas!, { reducedMotion }))
			.then(async (created) => {
				if (disposed) return created.dispose();
				scene = created;
				await created.loadRoom(stage.setting, (f) => (progress = f));
				created.setPose(stage.pose);
				loading = false;
			})
			.catch(() => {
				failed = true;
				loading = false;
			});

		function onFullscreenChange() {
			// Desktop only: Escape ends browser fullscreen, and that should end the scene too.
			if (!document.fullscreenElement && immersive && !touchDevice()) exitImmersive();
		}
		document.addEventListener('fullscreenchange', onFullscreenChange);

		return () => {
			disposed = true;
			document.removeEventListener('fullscreenchange', onFullscreenChange);
			stopClip();
			scene?.dispose();
			scene = null;
		};
	});

	// Only the scene scrolls while it's fullscreen, and drags never bounce the page.
	$effect(() => {
		if (!immersive) return;
		const prev = document.body.style.overflow;
		const prevOverscroll = document.documentElement.style.overscrollBehavior;
		document.body.style.overflow = 'hidden';
		document.documentElement.style.overscrollBehavior = 'none';
		return () => {
			document.body.style.overflow = prev;
			document.documentElement.style.overscrollBehavior = prevOverscroll;
		};
	});

	/** Any touchscreen, including an iPad with a trackpad attached. */
	function touchDevice() {
		return window.matchMedia('(any-pointer: coarse)').matches;
	}

	function enterImmersive() {
		immersive = true;
		// Touch devices skip browser fullscreen: a swipe ends it, which would end the scene.
		if (!touchDevice()) container?.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
		requestAnimationFrame(() => container?.querySelector<HTMLElement>('.viewport')?.focus());
		scene?.refresh();
	}

	function exitImmersive() {
		immersive = false;
		playing = false;
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
		stopClip();
		scene?.refresh();
	}

	function start() {
		if (!gate.canStart()) {
			// The sign-up / paywall modal lives on the page under the overlay.
			exitImmersive();
			gate.block();
			return;
		}
		if (!gate.tryStartRound()) return;
		playing = true;
		run++;
		enterImmersive();
	}

	function again() {
		playing = false;
		start();
	}

	function toggleMute() {
		muted = !muted;
		if (muted) stopClip();
		try {
			localStorage.setItem('pa-room-hunt-muted', muted ? '1' : '0');
		} catch {
			// Only the preference is lost.
		}
	}

	function onkeydown(event: KeyboardEvent) {
		if ((event.target as HTMLElement).closest('button, input, a')) return;
		const step = 0.12;
		const turns: Record<string, [number, number]> = {
			ArrowLeft: [step, 0],
			ArrowRight: [-step, 0],
			ArrowUp: [0, step],
			ArrowDown: [0, -step]
		};
		const turn = turns[event.key];
		if (!turn) return;
		event.preventDefault();
		scene?.turn(...turn);
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && immersive && !document.fullscreenElement) exitImmersive();
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="scenario" class:immersive bind:this={container} style="--accent:{accent}; --deep:{deep};">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="viewport"
		tabindex="0"
		role="application"
		aria-label="{scenario.title}. Drag or use the arrow keys to look around."
		{onkeydown}
	>
		<canvas bind:this={canvas}></canvas>

		{#if loading}
			<div class="overlay">
				<p>Setting the scene…</p>
				<div class="bar" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
					<span style="width:{progress * 100}%"></span>
				</div>
			</div>
		{:else if failed}
			<div class="overlay" role="alert">
				<p>The scene couldn't load. Your browser may not support 3D graphics (WebGL).</p>
			</div>
		{/if}

		{#if immersive}
			<div class="hud-top">
				<button type="button" class="icon-btn hud-btn" onclick={exitImmersive} aria-label="Exit">
					✕
				</button>
				<span class="pill">{scenario.emoji} {runProgress || scenario.title}</span>
				<div class="hud-right">
					{#if level === 'normal'}
						<button
							type="button"
							class="icon-btn hud-btn text"
							aria-pressed={showTranslit}
							onclick={() => (showTranslit = !showTranslit)}
							title="Transliteration">abc</button
						>
					{/if}
					<button
						type="button"
						class="icon-btn hud-btn"
						aria-pressed={!muted}
						onclick={toggleMute}
						aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>{muted ? '🔇' : '🔊'}</button
					>
				</div>
			</div>

			{#if playing && scene && !loading}
				{#key run}
					<ScenarioPlayer
						{scene}
						{entry}
						{dialect}
						{level}
						{translit}
						{muted}
						{signedIn}
						{isSubscribed}
						{accent}
						{deep}
						bind:progress={runProgress}
						restPose={stage.pose}
						exitLabel="Back to the scenes"
						onRestart={again}
						onExit={exitImmersive}
					/>
				{/key}
			{/if}
		{/if}
	</div>

	{#if !immersive}
		<div class="card">
			<div class="intro">
				<span class="emoji" aria-hidden="true">{scenario.emoji}</span>
				<div>
					<h2>{scenario.title}</h2>
					<p class="blurb">{scenario.blurb}</p>
				</div>
			</div>
			<p class="note">
				You'll talk with the {scenario.npcRole.toLowerCase()} in your dialect: their words appear
				on screen and you reply by tapping a phrase or saying it.
			</p>
			<div class="actions">
				<PressButton onclick={start} {accent} {deep} disabled={loading || failed}>
					Start the conversation
				</PressButton>
			</div>
			<div class="toggles">
				{#if level === 'normal'}
					<label><input type="checkbox" bind:checked={showTranslit} /> Transliteration</label>
				{/if}
				<label><input type="checkbox" checked={!muted} onchange={toggleMute} /> Sound</label>
			</div>
		</div>
	{/if}
</div>

<style>
	.scenario {
		display: grid;
		gap: 0.75rem;
	}

	.scenario.immersive {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: block;
		background: #000;
		/* Drags on the HUD must not scroll or bounce the page underneath. */
		touch-action: none;
		overscroll-behavior: none;
	}

	.viewport {
		position: relative;
		height: min(56dvh, 460px);
		min-height: 280px;
		border-radius: 1.25rem;
		overflow: hidden;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		outline: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.viewport:focus-visible {
		border-color: var(--accent);
	}

	.immersive .viewport {
		position: absolute;
		inset: 0;
		height: auto;
		min-height: 0;
		border: 0;
		border-radius: 0;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
		cursor: grab;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 0.75rem;
		padding: 1.5rem;
		text-align: center;
		font-weight: 600;
		color: var(--text1);
		background: var(--tile3);
	}

	.bar {
		width: min(16rem, 70vw);
		height: 0.5rem;
		border-radius: 100px;
		background: var(--tile5);
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 0.3s ease;
	}

	.hud-top {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: max(0.75rem, env(safe-area-inset-top)) 0.75rem 0.75rem;
		pointer-events: none;
	}

	.hud-top > * {
		pointer-events: auto;
	}

	.hud-right {
		display: flex;
		gap: 0.4rem;
		margin-left: auto;
	}

	.pill {
		margin: 0 auto;
		padding: 0.4rem 0.95rem;
		border-radius: 100px;
		font-size: 0.85rem;
		font-weight: 700;
		color: #fff;
		background: rgb(0 0 0 / 0.5);
		backdrop-filter: blur(6px);
		white-space: nowrap;
	}

	.icon-btn {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 50%;
		cursor: pointer;
	}

	.hud-btn {
		color: #fff;
		background: rgb(0 0 0 / 0.5);
		border: 2px solid rgb(255 255 255 / 0.2);
		backdrop-filter: blur(6px);
	}

	.hud-btn.text {
		font-size: 0.75rem;
		font-weight: 700;
	}

	.hud-btn[aria-pressed='false'].text {
		opacity: 0.55;
	}

	.card {
		display: grid;
		gap: 0.75rem;
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.9rem 1.1rem;
	}

	.intro {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.emoji {
		font-size: 2rem;
	}

	h2 {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text1);
	}

	.blurb,
	.note {
		font-size: 0.9rem;
		color: var(--text2);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.82rem;
		color: var(--text2);
	}

	.toggles label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
	}

	.toggles input {
		accent-color: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.bar span {
			transition: none;
		}
	}
</style>
