<script lang="ts">
  import WriteWordBlock from '$lib/components/dialect-shared/vocab/WriteWordBlock.svelte';
  import Button from '$lib/components/Button.svelte';

  let { data } = $props();

  let index = $state(0);
  let word = $derived(data.words[index]);
  let mode = $state('type');

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

  function switchMode() {
    mode = mode === 'type' ? 'draw' : 'type';
  }
</script>

<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
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
  {#if word}
<WriteWordBlock 
  {word} 
  {mode} 
  {switchMode} 
  dialect="fusha"
/>
{/if}
</div>
