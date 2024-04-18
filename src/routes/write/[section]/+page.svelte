<script>
	import WordBlock from './components/WordBlock.svelte';
	import Button from '../../../components/Button.svelte';
	export let data;

	let index = 0;

  $: mode = 'keyboard';

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

  function switchMode() {
    mode = mode === 'draw' ? 'keyboard' : 'draw';
  }
</script>

<section>
	<div class="m-auto text-center pt-8 px-8 bg-tile-300">
		<div class="flex w-full justify-between">
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
	</div>
  <WordBlock {word} {mode} {switchMode} />
</section>
