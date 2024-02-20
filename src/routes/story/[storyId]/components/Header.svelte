<script lang="ts">
  import Button from "../../../../components/Button.svelte";

  export let showEnglish = true;
	export let showArabic = true;
	export let showTransliterated = true;
	export let showWordDetails = true;
  export let key = '';
  export let previousSentence = () => {};
  export let nextSentence = () => {};
  export let updateBlocksToShow = (value: Event) => {};
  export let sentence = 0;

</script>

<header class="flex flex-col gap-4 sm:flex-row justify-between w-full p-3 border-2 border-blue-400 bg-blue-300">
  <figure>
    <figcaption>Listen to the Story</figcaption>
    <audio controls src={`/src/stories/${key}.mp3`}></audio>
  </figure>
  <div>
    <div class="flex flex-row gap-1">
      <Button onClick={previousSentence} type="button">Back</Button>
      <Button onClick={nextSentence} type="button">Next</Button>
    </div>
    <p>Sentance: {sentence + 1}</p>
    <div>
      <ul>
        <li>
          <label>
            <input type="checkbox" bind:checked={showEnglish} value="english" on:change={updateBlocksToShow} />
            Show English
          </label>
          <label>
            <input type="checkbox" bind:checked={showArabic} value="arabic" on:change={updateBlocksToShow} />
            Show Arabic
          </label>
          <label>
            <input type="checkbox" bind:checked={showTransliterated} value="transliterated" on:change={updateBlocksToShow} />
            Show Transliterated
          </label>
          <label>
            <input type="checkbox" bind:checked={showWordDetails} value="word-details" on:change={updateBlocksToShow} />
            Show Word Details
          </label>
        </li>
      </ul>
    </div>
  </div>  
</header>