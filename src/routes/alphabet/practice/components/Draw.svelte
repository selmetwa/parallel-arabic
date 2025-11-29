<script lang="ts">
	import { type Letter } from '$lib/types';
	import Button from '$lib/components/Button.svelte';
	import Canvas from './Canvas.svelte';
	import Audio from '$lib/components/Audio.svelte';
	
	interface Props {
		letter: Letter;
	}

	let { letter }: Props = $props();

	let showHint = $state(false);
	let showAnswer = $state(false);
	let svgData = $state('');

	// Reset when letter changes
	$effect(() => {
		if (letter.isolated) {
			showHint = false;
			showAnswer = false;
			svgData = '';
		}
	});

	function toggleHint() {
		showHint = !showHint;
	}

	async function toggleAnswer() {
		if (showAnswer === false) {
			showAnswer = true;
			const response = await fetch(`/letters/${letter.key}.svg`);
			let svgText = await response.text();
			const fillColor = 'var(--text2)';
			svgData = svgText.replace(/fill="[^"]*"/g, `fill="${fillColor}"`);
		} else {
			showAnswer = false;
			svgData = '';
		}
	}
</script>

<div class="flex flex-col sm:flex-row sm:justify-between">
	<div class="flex flex-col gap-1">
		<h2 class="text-text-200">Listen to the audio and write the letter</h2>
		<Audio src={`/letters/audios/${letter.key}.mp3`}></Audio>
	</div>
	<div class="mt-12">
		<div>
			<Button className="!h-fit !w-fit" onClick={toggleHint} type="button">
				{showHint ? 'Hide' : 'Show'} hint
			</Button>
			<Button className="!h-fit !w-fit" onClick={toggleAnswer} type="button">
				{showAnswer ? 'Hide' : 'Show'} answer
			</Button>
		</div>
		{#if showHint}
			<p class="mt-2 text-xl text-text-200">{letter.name}</p>
		{/if}
	</div>
</div>
{#if showAnswer}
	<div class="flex items-center justify-center mx-auto">
		{@html svgData}
	</div>
{/if}

<Canvas {letter} size={20} />
