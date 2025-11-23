<script lang="ts">
  import levenshtein from 'fast-levenshtein';
  import Button from '$lib/components/Button.svelte';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
  import RecordButton from '$lib/components/RecordButton.svelte';
  import Similarity from '$lib/components/Similarity.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import SaveButton from '$lib/components/SaveButton.svelte';
  import { type Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';

  let { sentence, resetSentences, dialect } = $props();

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

  // Dialect Comparison State
  let isComparisonModalOpen = $state(false);
  let comparisonData = $state<DialectComparisonSchema | null>(null);
  let isComparing = $state(false);
  let comparisonError = $state<string | null>(null);

  async function compareDialects() {
    isComparing = true;
    isComparisonModalOpen = true;
    comparisonData = null;
    comparisonError = null;

    try {
      const res = await fetch('/api/compare-dialects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: sentence.arabic,
          currentDialect: dialect,
          transliteration: sentence.transliteration
        })
      });
      
      if (res.ok) {
        comparisonData = await res.json();
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to compare dialects' }));
        comparisonError = errorData.message || 'Failed to compare dialects. Please try again.';
      }
    } catch (e) {
      comparisonError = e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.';
    } finally {
      isComparing = false;
    }
  }

  function closeComparisonModal() {
    isComparisonModalOpen = false;
  }

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

  const dialectName: Record<Dialect, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic'
  }

  async function askChatGTP(word: string) {
		targetWord = word;
		isLoadingDefinition = true;
		openDefinitionModal();
		const question = `What does ${word} mean in ${dialectName[dialect as Dialect]}? Considering the following sentences:
		Arabic: "${sentence.arabic}"
		English: "${sentence.english}"
		Transliteration: "${sentence.transliteration}"
		
		Please provide a definition based on the context.`;
		
		const res = await fetch('/api/definition-sentence', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				question: question
			})
		});

		const data = await res.json();

		// Store the structured JSON response as a string so the UI can parse it
		try {
			const parsed = JSON.parse(data.message.content);
			definition = JSON.stringify(parsed);
		} catch (e) {
			// Fallback for plain text responses (shouldn't happen with structured output)
			definition = data.message.content;
		}
		
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
		description: definition,
	}}
	isModalOpen={isDefinitionModalOpen}
	closeModal={closeDefinitionModal}
></DefinitionModal>

<DialectComparisonModal
  isOpen={isComparisonModalOpen}
  closeModal={closeComparisonModal}
  originalText={sentence.arabic}
  originalEnglish={sentence.english}
  {comparisonData}
  isLoading={isComparing}
  error={comparisonError}
  currentDialect={dialect}
/>

<div class="px-4 mt-6 sm:px-8 lg:px-12 max-w-7xl mx-auto pb-12">
	<!-- Controls Bar -->
	<div class="flex flex-wrap items-center justify-center gap-3 mb-8 p-4 bg-tile-300/50 border border-tile-500/30 rounded-xl">
		<AudioButton text={sentence.arabic} dialect={dialect}>Hear Audio</AudioButton>
		<Button onClick={() => showHint = !showHint} type="button" className="!py-2 !px-4 !text-sm bg-tile-400 hover:bg-tile-500 text-text-200 border-tile-500">
      {showHint ? 'Hide Transliteration' : 'Show Transliteration'}
    </Button>
		<Button onClick={() => showAnswer = !showAnswer} type="button" className="!py-2 !px-4 !text-sm bg-tile-400 hover:bg-tile-500 text-text-200 border-tile-500">
      {showAnswer ? 'Hide Arabic' : 'Show Arabic'}
    </Button>
		<Button onClick={compareDialects} type="button" className="!py-2 !px-4 !text-sm bg-tile-400 hover:bg-tile-500 text-text-200 border-tile-500">
      Compare Dialects
    </Button>
		<SaveButton
			objectToSave={{
				arabic: sentence.arabic,
				english: sentence.english,
				transliterated: sentence.transliteration
			}}
			type="Sentence"
		></SaveButton>
		<Button onClick={resetSentences} type="button" className="!py-2 !px-4 !text-sm bg-red-50 hover:bg-red-100 text-red-600 border-red-200">
      Reset
    </Button>
	</div>

  <!-- Recording Area -->
	<div class="bg-tile-400/30 border-2 border-tile-600 flex flex-col gap-8 items-center px-6 py-16 shadow-lg rounded-xl min-h-[400px] h-full relative overflow-hidden">
		{#if !recording}
			<button class="absolute top-6 right-6 z-10 transition-transform hover:scale-110" onclick={startRecording} disabled={recording} aria-label="Start Recording">
				<RecordButton />
			</button>
		{:else}
			<button class="absolute top-6 right-6 z-10 transition-transform hover:scale-110" onclick={stopRecording} disabled={!recording} aria-label="Stop Recording">
				<AudioLoading />
			</button>
		{/if}

		{#if similarity > 0}
			<div class="absolute left-6 top-6 z-10 scale-90 origin-top-left">
				<Similarity score={similarity} />
			</div>
		{/if}
		
		<div class="text-center w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-1 gap-8">
			<h3 class="text-4xl sm:text-5xl md:text-6xl text-text-300 font-bold leading-relaxed flex flex-wrap justify-center gap-x-2 gap-y-1">
				{#each sentence.english.split(' ') as word}
					<button
						onclick={() => askChatGTP(word)}
						class="px-1 py-0.5 rounded transition-all duration-200 hover:bg-tile-500/50 hover:text-tile-800 border-b-2 border-transparent hover:border-tile-600">
							{word}
					</button>
				{/each}
			</h3>
			
			<div class="flex flex-col gap-4 items-center w-full transition-all duration-300 min-h-[6rem]">
				{#if showHint}
					<p class="text-2xl text-text-200 font-medium italic bg-tile-300/50 px-6 py-2 rounded-full border border-tile-500/30 animate-in fade-in slide-in-from-bottom-2">
						{sentence.transliteration}
					</p>
				{/if}

				{#if showAnswer}
					<p class="text-4xl sm:text-5xl text-text-300 font-bold font-arabic mt-2 animate-in fade-in slide-in-from-bottom-2" dir="rtl">
						{sentence.arabic}
					</p>
				{/if}
			</div>
		</div>
		
		{#if transcribedText}
			<div class="w-full max-w-3xl px-6 py-6 bg-tile-300/50 border border-tile-500/50 rounded-xl mt-8 animate-in slide-in-from-bottom-4">
        <p class="text-sm text-text-200 mb-2 uppercase tracking-wider font-bold text-center">You said:</p>
				<p class="text-3xl sm:text-4xl text-center text-text-300 font-arabic" dir="rtl">
					{transcribedText}
				</p>
			</div>
		{/if}
	</div>
</div>
