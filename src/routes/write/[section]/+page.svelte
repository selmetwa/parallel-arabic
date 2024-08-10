<script>
	import WordBlock from './components/WordBlock.svelte';
	import Button from '$lib/components/Button.svelte';
	export let data;

	let index = 0;

  let mode = 'keyboard';

	function next() {
		if (index === data.words.length - 1) {
			return;
		}
		index = index + 1;
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
	}

	$: word = data.words.slice(1)[index];

  function handleSwitchMode() {
    mode = mode === 'draw' ? 'keyboard' : 'draw';
  }
</script>

<header class="px-4 sm:px-16 bg-tile-400 py-8 text-center border-b border-tile-600">
		<div class="flex w-full justify-between items-center">
			<div class="w-max">
				{#if index > 0}
					<Button onClick={previous} type="button">Previous</Button>
				{/if}
			</div>
      <div>
        <h1 class="text-lg font-bold text-text-300">{index + 1} / {data.words.length}</h1>
      </div>
			<div class="w-max">
				{#if index < data.words.length - 1}
					<Button onClick={next} type="button">Next</Button>
				{/if}
			</div>
		</div>
</header>

<section class="px-4 sm:px-16">
  <WordBlock {word} {mode} switchMode={handleSwitchMode} />
</section>
