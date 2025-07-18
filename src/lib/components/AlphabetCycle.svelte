<script lang="ts">
	import { onMount } from 'svelte';

	export let size: number = 80;
	export let duration: number = 1500; // milliseconds per letter

	// Arabic alphabet letters
	const arabicLetters = [
		'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
		'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
		'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
	];

	// Arabic letter names
	const letterNames = [
		'Alif', 'Baa', 'Taa', 'Thaa', 'Jeem', 'Haa', 'Khaa', 'Dal', 'Thal', 'Raa',
		'Zay', 'Seen', 'Sheen', 'Sad', 'Dad', 'Taa', 'Zaa', 'Ayn', 'Ghayn', 'Faa',
		'Qaf', 'Kaf', 'Lam', 'Meem', 'Noon', 'Haa', 'Waw', 'Yaa'
	];

	let currentIndex = 0;
	let intervalId: ReturnType<typeof setInterval>;

	onMount(() => {
		intervalId = setInterval(() => {
			currentIndex = (currentIndex + 1) % arabicLetters.length;
		}, duration);

		return () => {
			clearInterval(intervalId);
		};
	});

	$: currentLetter = arabicLetters[currentIndex];
	$: currentLetterName = letterNames[currentIndex];
</script>

<div 
role="status"
class="alphabet-cycle" style="width: {size}px; height: {size}px;">
<span class="sr-only">Loading...</span>
	<svg
		width={size}
		height={size}
		viewBox="0 0 100 100"
		class="alphabet-svg"
	>
		<!-- Outer ring animation -->
		<circle
			cx="50"
			cy="50"
			r="45"
			fill="var(--tile6)"
			stroke="var(--brand)"
			stroke-width="2"
			class="outer-ring"
		/>
		
		<!-- Arabic letter -->
		<text
			x="50"
			y="60"
			text-anchor="middle"
			dominant-baseline="middle"
			font-size="32"
			font-weight="bold"
			fill="var(--text1)"
			class="arabic-letter"
		>
			{currentLetter}
		</text>
	</svg>
	
	<!-- Letter name below the circle -->
	<div class="letter-name">
		{currentLetterName}
	</div>
</div>

<style>
	.alphabet-cycle {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1px;
	}

	.alphabet-svg {
		/* Removed rotation animation */
	}

	.outer-ring {
		/* Fixed border - no animation */
	}

	.inner-circle {
		/* No animation - static background */
	}

	.arabic-letter {
    font-size: 50px;
		font-family: 'Amiri', 'Noto Sans Arabic', serif;
	}

	.letter-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--text2);
		text-align: center;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.loading-dots .dot {
		animation: dotBounce 1.4s ease-in-out infinite both;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
