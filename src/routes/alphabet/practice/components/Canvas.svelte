<script>
	import { onMount } from 'svelte';

	export let width = 700;
	export let height = 400;
	export let color = 'var(--text3)';
	export let background = '#fff';
	export let letter;

	$: if (letter) {
		clearCanvas();
	}
	let canvas;
	let context;
	let isDrawing;
	let start;

	let t, l;

	onMount(() => {
		context = canvas.getContext('2d');
		context.lineWidth = 10;

		handleSize();
	});

	$: if (context) {
		context.strokeStyle = color;
	}

	const handleStart = ({ offsetX: x, offsetY: y }) => {
		if (color === background) {
			context.clearRect(0, 0, width, height);
		} else {
			isDrawing = true;
			start = { x, y };
		}
	};

	const handleEnd = () => {
		isDrawing = false;
	};
	const handleMove = ({ offsetX: x1, offsetY: y1 }) => {
		if (!isDrawing) return;

		const { x, y } = start;
		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(x1, y1);
		context.closePath();
		context.stroke();

		start = { x: x1, y: y1 };
	};

	const clearCanvas = () => {
    if (typeof context !== 'undefined') {
      context.clearRect(0, 0, width, height);
    }
	};

	const handleSize = () => {
		const { top, left } = canvas.getBoundingClientRect();
		t = top;
		l = left;
	};
</script>

<svelte:window on:resize={handleSize} />

<div>
	<button on:click={clearCanvas} class="text-sm text-text-200 underline">Clear Canvas</button>
	<canvas
		id="main-canvas"
		class="border-[10px] border-tile-500"
		{width}
		{height}
		style:background
		bind:this={canvas}
		on:mousedown={handleStart}
		on:touchstart={(e) => {
			const { clientX, clientY } = e.touches[0];
			handleStart({
				offsetX: clientX - l,
				offsetY: clientY - t
			});
		}}
		on:mouseup={handleEnd}
		on:touchend={handleEnd}
		on:mouseleave={handleEnd}
		on:mousemove={handleMove}
		on:touchmove={(e) => {
			const { clientX, clientY } = e.touches[0];
			handleMove({
				offsetX: clientX - l,
				offsetY: clientY - t
			});
		}}
	/>
</div>
