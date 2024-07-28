  <script lang="ts">
	  import Button from '../../../components/Button.svelte';
    import WordBlock from './components/WordBlock.svelte';
  	import type { wordObjectItem, wordObjectGroup } from '../../../types';

  export let data: any;

	let index = 0;

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

  function shuffleArray(array: any) {
    const _arr = [...array];
    for (let i = _arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [_arr[i], _arr[j]] = [_arr[j], _arr[i]];
    }
    return _arr;
  }

  $: wordObj = {} as wordObjectGroup;
  let word = data.words.slice(1)[0];
  let shuffledWords = shuffleArray(data.words.slice(1).filter((w: any) => word.english !== w.english));
  let shuffledAnswers = shuffleArray([word, shuffledWords[0], shuffledWords[1], shuffledWords[2]]);
  $: {
    if (data.words.length > index) {
      word = data.words.slice(1)[index];
      shuffledWords = shuffleArray(data.words.slice(1));
      shuffledAnswers = shuffleArray([word, shuffledWords[0], shuffledWords[1], shuffledWords[2]]);

      if (shuffledAnswers) {
        wordObj.answer = word;
        wordObj.first = shuffledAnswers[0];
        wordObj.second = shuffledAnswers[1];
        wordObj.third = shuffledAnswers[2];
        wordObj.fourth = shuffledAnswers[3];
      }
    }
  }
</script>

<section>
	<div class="m-auto text-center py-8 pb-4 px-8 bg-tile-300">
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
</section>

<WordBlock {wordObj} {next} />
