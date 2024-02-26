<script lang="ts">
  import Button from "../../../../components/Button.svelte";

  export let showEnglish = true;
	export let showArabic = true;
	export let showTransliterated = true;
	export let showWordDetails = true;
  export let key = '';
  export let previousSentence = () => {};
  export let nextSentence = () => {};

  export let handleOpenDrawer = () => {};

  export let updateBlocksToShow = (value: Event) => {};
  export let sentence = 0;

</script>

<header class="flex flex-col gap-4 sm:flex-row justify-between w-full p-3 border-2 border-tile-600 bg-tile-300">
  <figure>
    <figcaption>Listen to the Story</figcaption>
    <audio controls src={`/src/stories/${key}.mp3`}></audio>
  </figure>
  <div>
    <div class="flex flex-row gap-1">
      <Button onClick={handleOpenDrawer} type="button">Open Drawer</Button>
      <Button onClick={previousSentence} type="button">Back</Button>
      <Button onClick={nextSentence} type="button">Next</Button>
    </div>
    <p>Sentance: {sentence + 1}</p>
  </div>  
</header>