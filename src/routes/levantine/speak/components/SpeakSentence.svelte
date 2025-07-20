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

  let recording = $state(false);
  let mediaRecorder: MediaRecorder | null = $state(null);
  let audioChunks: Blob[] = $state([]);
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

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
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
		const question = `What does ${word} mean in Levantine Arabic? Considering the following sentences ${sentence.arabic} ${sentence.english} ${sentence.transliteration} but please do not reveal the entire meaning of the sentence, and dont say anything about the rest of the sentence at all, just use it as a reference to derive the definition.`;

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

<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
	<div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-12">
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
	</div>

	<div class="bg-tile-300 border border-tile-500 flex flex-col gap-4 items-center px-3 py-12 shadow-lg mt-6 min-h-[300px] h-full relative">
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
		
		<div class="text-center">
			<h3 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2">
				{#each sentence.english.split(' ') as word}
					<button
						onclick={() => askChatGTP(word)}
						class="p-1 text-3xl sm:text-4xl duration-300 hover:bg-tile-500 border-2 border-transparent hover:border-tile-600">
							{word}
					</button>
				{/each}
			</h3>
			
			<div class="flex flex-col gap-2 mt-4">
				{#if showHint}
					<p class="text-xl text-text-200">
						{sentence.transliteration}
					</p>
				{/if}

				{#if showAnswer}
					<p class="text-3xl text-text-300">
						{sentence.arabic}
					</p>
				{/if}
			</div>
		</div>
		
		{#if transcribedText}
			<div class="w-full px-3 py-4 bg-tile-400 border border-tile-500 mt-4">
				<p class="text-2xl sm:text-3xl text-center text-text-300">
					{transcribedText}
				</p>
			</div>
		{/if}
	</div>
</div>