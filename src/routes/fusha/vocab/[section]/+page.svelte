<script lang="ts">
  import VocabQuizBlock from '$lib/components/dialect-shared/vocab/VocabQuizBlock.svelte';
  import Button from '$lib/components/Button.svelte';

  let { data } = $props();

  let index = $state(0);
  let word = $derived(data.words[index]);

	function shuffleArray(array: any) {
		const _arr = [...array];
		for (let i = _arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[_arr[i], _arr[j]] = [_arr[j], _arr[i]];
		}
		return _arr;
	}

  let wordObj = $derived.by(() => {
    if (data.words.length > index) {
			const _shuffledWords = shuffleArray(data.words.filter((w: any) => word.english !== w.english));
			const _shuffledAnswers = shuffleArray([word, _shuffledWords[0], _shuffledWords[1], _shuffledWords[2]]);

      return {
        answer: word,
        first: _shuffledAnswers[0],
        second: _shuffledAnswers[1],
        third: _shuffledAnswers[2],
        fourth: _shuffledAnswers[3]
      };
    }
  })

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
</script>

<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">

  {#if wordObj}
    <VocabQuizBlock 
      {wordObj} 
      {next} 
      dialect="fusha"
    />
  {/if}

  <header class="border-b border-tile-600 bg-tile-400 px-3 py-4 text-center sm:px-8 mt-8">
    <div class="flex w-full items-center justify-between max-w-5xl mx-auto">
      <div class="w-max">
        {#if index > 0}
          <Button onClick={previous} type="button">Previous</Button>
        {/if}
      </div>
      <div>
        <h1 class="text-lg font-bold text-text-300">{index + 1} / {data.words.length} words</h1>
      </div>
      <div class="w-max">
        {#if index < data.words.length - 1}
          <Button onClick={next} type="button">Next</Button>
        {/if}
      </div>
    </div>
  </header>
</div>
