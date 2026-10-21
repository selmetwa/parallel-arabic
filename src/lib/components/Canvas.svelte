<script>
	import { strokePath } from '$lib/helpers/freehand';

	let { letter, size } = $props();

	let points = $state([[]]);
	let pathData = $state([]);

	function handlePointerDown(e) {
		e.target.setPointerCapture(e.pointerId);
		const rect = e.target.getBoundingClientRect();
		points = [...points, [[e.clientX - rect.left, e.clientY - rect.top, e.pressure]]];
	}

	function handlePointerMove(e) {
		if (e.buttons !== 1) return;
		const rect = e.target.getBoundingClientRect();
		const lastIndex = points.length - 1;
		points[lastIndex] = [...points[lastIndex], [e.clientX - rect.left, e.clientY - rect.top, e.pressure]];
	}

	function clear() {
		points = [[]];
	}

	// Clear when letter changes
	$effect(() => {
		if (letter) {
			clear();
		}
	});

	// Update path data when points change
	$effect(() => {
		pathData = points.map((strokePoints) => strokePath(strokePoints, size));
	});
</script>

<div class="wrapper">
	<button onclick={clear} class="text-text-200 underline mb-2">Clear</button>
	<svg onpointerdown={handlePointerDown} onpointermove={handlePointerMove} style="touch-action: none;">
		{#each pathData as path, i (i)}
			<path d={path} />
		{/each}
	</svg>
</div>

<style>
	.wrapper {
		user-select: none;
	}

	svg {
		width: 100%;
		height: 500px;
		border: 2px solid var(--tile6);
		fill: var(--text3);
		background-color: var(--tile4);
		touch-action: none;
	}
</style>
