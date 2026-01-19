<script lang="ts">
  import levenshtein from 'fast-levenshtein';
  import Button from '$lib/components/Button.svelte';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
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
  let isTranscribing = $state(false);

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
      isTranscribing = false;
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
      isTranscribing = true;

      try {
        // Create a File object to send to the backend
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", file);
        formData.append("dialect", dialect); // Send dialect for Chirp 3
        formData.append("language", "ar");

        const response = await fetch("/api/speech-to-text", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        transcribedText = data.text || "";
      } catch (error) {
        console.error('Speech-to-text error:', error);
        transcribedText = "";
      } finally {
        isTranscribing = false;
      }
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

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
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

  // Get feedback text based on similarity
  function getFeedback(score: number): { text: string; emoji: string; color: string } {
    if (score >= 90) return { text: "Excellent!", emoji: "🎉", color: "text-green-500" };
    if (score >= 75) return { text: "Great job!", emoji: "👏", color: "text-emerald-500" };
    if (score >= 60) return { text: "Good effort!", emoji: "👍", color: "text-yellow-500" };
    if (score >= 40) return { text: "Keep practicing!", emoji: "💪", color: "text-orange-500" };
    return { text: "Try again!", emoji: "🔄", color: "text-red-500" };
  }
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

  <!-- Main Content Area -->
	<div class="bg-tile-400/30 border-2 border-tile-600 flex flex-col items-center px-6 py-12 shadow-lg rounded-xl min-h-[500px]">
		
		<!-- Sentence to speak -->
		<div class="text-center w-full max-w-4xl mx-auto flex flex-col items-center gap-6 mb-10">
			<h3 class="text-3xl sm:text-4xl md:text-5xl text-text-300 font-bold leading-relaxed flex flex-wrap justify-center gap-x-2 gap-y-1">
				{#each sentence.english.split(' ') as word}
					<button
						onclick={() => askChatGTP(word)}
						class="px-1 py-0.5 rounded transition-all duration-200 hover:bg-tile-500/50 hover:text-tile-800 border-b-2 border-transparent hover:border-tile-600">
							{word}
					</button>
				{/each}
			</h3>
			
			<div class="flex flex-col gap-3 items-center w-full transition-all duration-300 min-h-[4rem]">
				{#if showHint}
					<p class="text-xl sm:text-2xl text-text-200 font-medium italic bg-tile-300/50 px-6 py-2 rounded-full border border-tile-500/30 animate-in fade-in slide-in-from-bottom-2">
						{sentence.transliteration}
					</p>
				{/if}

				{#if showAnswer}
					<p class="text-3xl sm:text-4xl text-text-300 font-bold font-arabic animate-in fade-in slide-in-from-bottom-2" dir="rtl">
						{sentence.arabic}
					</p>
				{/if}
			</div>
		</div>

		<!-- Big Record Button -->
		<button
			onclick={toggleRecording}
			disabled={isTranscribing}
			class="group flex flex-col items-center gap-4 p-8 rounded-3xl border-4 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed {recording ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/30' : 'bg-tile-300/50 border-tile-500 hover:border-tile-600 hover:bg-tile-400/50'}"
		>
			<div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 {recording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-red-400 to-red-600 group-hover:from-red-500 group-hover:to-red-700'}">
				{#if recording}
					<AudioLoading />
				{:else}
					<svg class="w-12 h-12 sm:w-14 sm:h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
						<path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
					</svg>
				{/if}
			</div>
			<span class="text-xl sm:text-2xl font-bold {recording ? 'text-red-500' : 'text-text-300'}">
				{#if isTranscribing}
					Processing...
				{:else if recording}
					Tap to Stop
				{:else}
					Tap to Speak
				{/if}
			</span>
			<span class="text-sm text-text-200">
				{#if recording}
					Recording your voice...
				{:else}
					Say the sentence in Arabic
				{/if}
			</span>
		</button>

		<!-- Result Section -->
		{#if isTranscribing}
			<div class="w-full max-w-2xl mt-10 px-6 py-8 bg-tile-300/50 border-2 border-tile-500/50 rounded-2xl animate-in slide-in-from-bottom-4">
				<div class="flex flex-col items-center gap-4">
					<div class="w-12 h-12 border-4 border-tile-500 border-t-tile-700 rounded-full animate-spin"></div>
					<p class="text-lg text-text-200 font-medium">Analyzing your speech...</p>
				</div>
			</div>
		{:else if transcribedText}
			{@const feedback = getFeedback(similarity)}
			<div class="w-full max-w-2xl mt-10 animate-in slide-in-from-bottom-4">
				<!-- Score Card -->
				<div class="px-6 py-8 bg-tile-300/50 border-2 border-tile-500/50 rounded-2xl">
					<!-- Score Display -->
					<div class="flex items-center justify-center gap-4 mb-6">
						<span class="text-5xl">{feedback.emoji}</span>
						<div class="text-center">
							<p class="text-4xl sm:text-5xl font-bold {feedback.color}">{Math.round(similarity)}%</p>
							<p class="text-lg font-semibold {feedback.color}">{feedback.text}</p>
						</div>
					</div>

					<!-- What you said -->
					<div class="border-t border-tile-500/30 pt-6">
						<p class="text-sm text-text-200 mb-3 uppercase tracking-wider font-bold text-center">You said:</p>
						<p class="text-2xl sm:text-3xl text-center text-text-300 font-arabic leading-relaxed" dir="rtl">
							{transcribedText}
						</p>
					</div>

					<!-- Expected (if answer is shown) -->
					{#if showAnswer}
						<div class="border-t border-tile-500/30 pt-6 mt-6">
							<p class="text-sm text-text-200 mb-3 uppercase tracking-wider font-bold text-center">Expected:</p>
							<p class="text-2xl sm:text-3xl text-center text-text-300 font-arabic leading-relaxed" dir="rtl">
								{sentence.arabic}
							</p>
						</div>
					{/if}

					<!-- Try Again Button -->
					<div class="mt-8 flex justify-center">
						<button
							onclick={() => { transcribedText = ""; similarity = 0; }}
							class="px-8 py-3 bg-tile-500 hover:bg-tile-600 text-text-300 font-semibold rounded-xl transition-colors flex items-center gap-2"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Try Again
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
