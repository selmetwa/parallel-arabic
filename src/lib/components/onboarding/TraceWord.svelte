<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { strokePath, type StrokePoints } from '$lib/helpers/freehand';
	import type { TraceTarget } from '$lib/constants/onboarding-try';

	interface Props {
		word: TraceTarget;
		onDone: () => void;
		onSkip: () => void;
	}

	let { word, onDone, onSkip }: Props = $props();

	const WIDTH = 320;
	const HEIGHT = 200;
	/** Enough ink to count as a go at it. There's no accuracy check. */
	const MIN_POINTS = 40;

	let strokes = $state<StrokePoints[]>([]);

	const paths = $derived(strokes.map((s) => strokePath(s, 12)));
	const inked = $derived(strokes.reduce((n, s) => n + s.length, 0) >= MIN_POINTS);

	/** Pointer position in viewBox units, so tracing lines up at any size. */
	function toPoint(e: PointerEvent): number[] {
		const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
		return [
			((e.clientX - rect.left) / rect.width) * WIDTH,
			((e.clientY - rect.top) / rect.height) * HEIGHT,
			e.pressure
		];
	}

	function onPointerDown(e: PointerEvent) {
		(e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
		strokes.push([toPoint(e)]);
	}

	function onPointerMove(e: PointerEvent) {
		if (e.buttons !== 1 || strokes.length === 0) return;
		strokes[strokes.length - 1].push(toPoint(e));
	}
</script>

<div class="mx-auto max-w-xl" in:fly={{ y: 20, duration: 400, easing: cubicOut }}>
	<div class="mb-6 text-center">
		<p class="font-arabic mb-2 text-2xl font-bold text-text-300/80 sm:text-3xl" dir="rtl" lang="ar">اكتب</p>
		<h2 class="mb-1.5 text-2xl font-bold tracking-tight text-text-300 sm:text-3xl">Now write it</h2>
		<p class="text-sm text-text-200 sm:text-base">
			Trace <span class="font-semibold text-text-300">{word.transliteration}</span>, “{word.english}”, with your finger. Arabic runs right to left.
		</p>
	</div>

	<svg
		class="trace"
		viewBox="0 0 {WIDTH} {HEIGHT}"
		role="img"
		aria-label="Tracing area for {word.arabic}"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
	>
		<text
			class="ghost font-arabic"
			x={WIDTH / 2}
			y={HEIGHT / 2}
			text-anchor="middle"
			dominant-baseline="central"
			direction="rtl"
			lang="ar">{word.arabic}</text
		>
		{#each paths as d, i (i)}
			<path {d} class="ink" />
		{/each}
	</svg>

	<div class="mt-2 flex justify-end">
		<button
			type="button"
			onclick={() => (strokes = [])}
			disabled={strokes.length === 0}
			class="text-sm font-semibold text-text-200 underline underline-offset-2 hover:text-text-300 disabled:opacity-40"
		>
			Clear
		</button>
	</div>

	<div class="mt-4 flex flex-col items-center gap-4">
		<button
			type="button"
			onclick={onDone}
			disabled={!inked}
			class="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{inked ? 'Done →' : 'Trace the word'}
		</button>
		<button
			type="button"
			onclick={onSkip}
			class="text-xs text-text-200/80 underline underline-offset-2 hover:text-text-300"
		>
			Skip for now
		</button>
	</div>
</div>

<style>
	.trace {
		display: block;
		width: 100%;
		aspect-ratio: 320 / 200;
		border: 2px solid var(--tile5);
		border-radius: 1rem;
		background: var(--tile3);
		touch-action: none;
		user-select: none;
		cursor: crosshair;
	}

	.ghost {
		font-size: 130px;
		fill: color-mix(in srgb, var(--text3) 12%, transparent);
		stroke: color-mix(in srgb, var(--text3) 45%, transparent);
		stroke-width: 1.5;
		stroke-dasharray: 5 4;
		pointer-events: none;
	}

	.ink {
		fill: #059669;
	}
</style>
