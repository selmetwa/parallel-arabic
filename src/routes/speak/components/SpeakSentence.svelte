<script lang="ts">
  import levenshtein from 'fast-levenshtein';
  import Button from '$lib/components/Button.svelte';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
  import RecordButton from '$lib/components/RecordButton.svelte';
  import Similarity from '$lib/components/Similarity.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import DefinitionModal from '../../sentences/components/DefinitionModal.svelte';
  import SaveButton from '$lib/components/SaveButton.svelte';
  let { sentence, resetSentences } = $props();

  $inspect(sentence);

  let recording = $state(false);
  let mediaRecorder = $state(null);
  let audioChunks = $state([]);
  let transcribedText = $state("");
  let showHint = $state(false);
  let showAnswer = $state(false);
  let similarity = $state(0);
	let isDefinitionModalOpen = $state(false);
	let isLoadingDefinition = $state(false);
	let definition = $state('');
	let targetWord = $state('');
  let audioURL = $state('');

  $effect(() => {
    if (sentence.arabic) {
      // reset everything
      recording = false;
      mediaRecorder = null;
      audioChunks = [];
      transcribedText = "";
      similarity = 0;
      isDefinitionModalOpen = false;
      isLoadingDefinition = false;
      definition = '';
      targetWord = '';
      audioURL = '';
    }
  });

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      audioURL = URL.createObjectURL(blob);
      audioChunks = []; // Clear for next recording

      // Create a File object to send to the backend
      const file = new File([blob], "recording.webm", { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      transcribedText = data.text;
    };

    mediaRecorder.start();
    recording = true;
  }

  function openDefinitionModal() {
		isDefinitionModalOpen = true;
	}

	function closeDefinitionModal() {
		isDefinitionModalOpen = false;
		definition = '';
	}

  async function askChatGTP(word: string) {
		targetWord = word;
		isLoadingDefinition = true;
		openDefinitionModal();
		const question = `What does ${word} mean in Egyptian Arabic? Considering the following sentences ${sentence.arabic} ${sentence.english} ${sentence.transliteration} but please do not reveal the entire meaning of the sentence, and dont say anything about the rest of the sentence at all, just use it as a reference to derive the definition.`;

		const res = await fetch('/api/open-ai', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				question: question
			})
		});

		const data = await res.json();

		definition = data.message.message.content;
		isLoadingDefinition = false;
	}

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      recording = false;
    }
  }

  $effect(() => {
    if (transcribedText) {
      const transcribedTextWithoutPeriods = transcribedText.replace(/\./g, '');
      const distance = levenshtein.get(sentence.arabic, transcribedTextWithoutPeriods);
      const maxLength = Math.max(sentence.arabic.length, transcribedTextWithoutPeriods.length);
      const _similarity = (1 - distance / maxLength) * 100; // Convert to percentage similarity
      similarity = _similarity;
    }
  });
</script>

<DefinitionModal
	activeWordObj={{
		english: targetWord,
		isLoading: isLoadingDefinition,
		description: definition
	}}
	isModalOpen={isDefinitionModalOpen}
	closeModal={closeDefinitionModal}
></DefinitionModal>
<header class="gap-4 mt-12 mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 px-2 md:px-5">
  <AudioButton text={sentence.arabic}>Hear Audio</AudioButton>
  <Button onClick={() => showHint = !showHint} type="button">{showHint ? 'Hide Transliteration' : 'Show Transliteration'}</Button>
  <Button onClick={() => showAnswer = !showAnswer} type="button">{showAnswer ? 'Hide Arabic' : 'Show Arabic'}</Button>
  <SaveButton
  objectToSave={{
    arabic: sentence.arabic,
    english: sentence.english,
    transliterated: sentence.transliteration
  }}
  type="Sentence"
></SaveButton>
<Button onClick={resetSentences} type="button">Reset</Button>
</header>
<section class="bg-tile-300 border border-tile-500 rounded-lg flex flex-col gap-4 items-center min-w-[50%] w-fit p-12 mx-auto mt-12 min-h-[300px] h-full relative">
  {#if !recording}
    <button class="absolute center top-0 right-[50%] translate-x-[50%] translate-y-[-50%]" onclick={startRecording} disabled={recording}>
      <RecordButton />
    </button>
  {:else}
    <button class="absolute center top-0 right-[50%] translate-x-[50%] translate-y-[-50%]" onclick={stopRecording} disabled={!recording}>
      <AudioLoading />
    </button>
  {/if}

  {#if similarity > 0}
    <div class="absolute right-0 top-0 md:translate-y-[-40%] md:translate-x-[40%]">
      <Similarity score={similarity} />
    </div>
  {/if}
  <h3 class="text-4xl text-text-300 font-medium">
    {#each sentence.english.split(' ') as word}
      <button
        onclick={() => askChatGTP(word)}
        class="p-1 text-[40px] duration-300 hover:bg-tile-500">
          {word}
      </button>
    {/each}
  </h3>
  <div class="flex flex-col gap-4">
    {#if showHint}
      <p class="text-2xl mt-2 text-text-200 font-medium">
        {sentence.transliteration}
      </p>
    {/if}

    {#if showAnswer}
      <p class="text-4xl mt-2 text-text-200 font-medium">
        {sentence.arabic}
      </p>
    {/if}
  </div>
  {#if transcribedText}
    <footer class="w-full p-4 bg-tile-400 border border-tile-500 rounded-lg">
      <p class="text-4xl text-center text-text-300">
        {transcribedText}
      </p>
    </footer>
  {/if}
</section>