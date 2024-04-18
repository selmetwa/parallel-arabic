<script lang="ts">
	import { type Letter } from '../../../../types';
	export let letter: Letter;
	import Button from '../../../../components/Button.svelte';
  import CanvasNew from './CanvasNew.svelte';

	let showHint = false;
	let showAnswer = false;

	$: if (letter.isolated) {
		showHint = false;
		showAnswer = false;
	}

	function toggleHint() {
		showHint = !showHint;
	}

  $: svgData = '';

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
		<audio src={`/letters/audios/${letter.key}.mp3`} controls></audio>
	</div>
	<div class="mt-4">
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

<CanvasNew  {letter} />
