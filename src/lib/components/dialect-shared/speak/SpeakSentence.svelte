<script lang="ts">
  import levenshtein from 'fast-levenshtein';
  import AudioLoading from '$lib/components/AudioLoading.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import SaveButton from '$lib/components/SaveButton.svelte';
  import { type Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';
  import { filterArabicCharacters } from '$lib/utils/arabic-normalization';

  interface Props {
    sentence: {
      arabic: string;
      arabicTashkeel?: string;
      english: string;
      transliteration: string;
    };
    resetSentences: () => void;
    dialect: Dialect;
  }

  let { sentence, resetSentences, dialect }: Props = $props();

  let recording = $state(false);
  let mediaRecorder: MediaRecorder | null = $state(null);
  let audioChunks: Blob[] = $state([]);
  let transcribedText = $state("");
  let showHint = $state(false);
  let showAnswer = $state(false);
  let showTashkeel = $state(false);
  let similarity = $state(0);
	let isDefinitionModalOpen = $state(false);
	let isLoadingDefinition = $state(false);
	let definition = $state('');
  let targetWord = $state('');
  let targetArabicWord = $state('');
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
      targetArabicWord = '';
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
		targetWord = '';
		targetArabicWord = '';
	}

  const dialectName: Record<Dialect, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic',
    iraqi: 'Iraqi Arabic',
    khaleeji: 'Khaleeji Arabic'
  }

  // Function to map English words to corresponding Arabic words
  function mapEnglishToArabic(englishWord: string): string {
    const allEnglishWords = sentence.english.split(' ');
    const allArabicWords = sentence.arabic.split(' ');

    // Find the index of the English word
    const index = allEnglishWords.findIndex((w: string) =>
      w.toLowerCase() === englishWord.toLowerCase()
    );

    if (index !== -1 && allArabicWords[index]) {
      return filterArabicCharacters(allArabicWords[index]);
    }

    // Fallback: return the whole Arabic sentence filtered
    return filterArabicCharacters(sentence.arabic);
  }

  function countTokens(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  async function askChatGTP(word: string) {
		targetWord = word;
		targetArabicWord = mapEnglishToArabic(word);
		const isSingleWordDefinition = countTokens(word) === 1 && countTokens(targetArabicWord) === 1;
		isLoadingDefinition = true;
		openDefinitionModal();
		const question = `What does ${word} mean in ${dialectName[dialect as Dialect]}? Considering the following sentences:
		Arabic: "${sentence.arabic}"
		English: "${sentence.english}"
		Transliteration: "${sentence.transliteration}"

		Please provide a definition based on the context.`;

		try {
			const res = await fetch('/api/definition-sentence', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({
					question,
					isSingleWordDefinition
				})
			});

			if (!res.ok) {
				console.error('Definition API error:', res.status);
				definition = 'Failed to load definition. Please try again.';
				isLoadingDefinition = false;
				return;
			}

			const data = await res.json();

			// Store the structured JSON response as a string so the UI can parse it
			try {
				let content = data.message?.content || '';

				// Strip markdown code blocks if present
				if (content.includes('```')) {
					content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
				}

				const parsed = JSON.parse(content);
				definition = JSON.stringify(parsed);
			} catch (e) {
				// Fallback for plain text responses (shouldn't happen with structured output)
				definition = data.message?.content || 'No definition available';
			}
		} catch (error) {
			console.error('Error fetching definition:', error);
			definition = 'Error loading definition. Please try again.';
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

  // Score colour follows the same cool → hot ramp as the difficulty picker.
  function getFeedback(score: number): { text: string; accent: string } {
    if (score >= 90) return { text: "Excellent!", accent: "#22c55e" };
    if (score >= 75) return { text: "Great job!", accent: "#84cc16" };
    if (score >= 60) return { text: "Good effort!", accent: "#eab308" };
    if (score >= 40) return { text: "Keep practicing!", accent: "#f97316" };
    return { text: "Try again!", accent: "#ef4444" };
  }
</script>

<DefinitionModal
	activeWordObj={{
		english: targetWord,
		arabic: targetArabicWord,
		isLoading: isLoadingDefinition,
		description: definition,
	}}
	isModalOpen={isDefinitionModalOpen}
	closeModal={closeDefinitionModal}
	dialect={dialect as Dialect}
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

<div class="w-full">
	<!-- Toolbar -->
	<div class="toolbar">
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				onclick={() => (showHint = !showHint)}
				aria-pressed={showHint}
				class="chip {showHint ? 'is-on' : ''}">Transliteration</button
			>
			<button
				type="button"
				onclick={() => (showAnswer = !showAnswer)}
				aria-pressed={showAnswer}
				class="chip {showAnswer ? 'is-on' : ''}">Arabic</button
			>
			{#if sentence.arabicTashkeel}
				<button
					type="button"
					onclick={() => (showTashkeel = !showTashkeel)}
					aria-pressed={showTashkeel}
					class="chip {showTashkeel ? 'is-on' : ''}">Tashkeel</button
				>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<AudioButton
				text={sentence.arabic}
				{dialect}
				className="!gap-1.5 !rounded-full !bg-sky-500 !px-4 !py-2 !text-[0.83rem] !font-semibold !text-white shadow-[0_3px_0_#0369a1] md:hover:!bg-sky-600"
			>
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
					<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
				</svg>
				Listen
			</AudioButton>
			<button type="button" onclick={compareDialects} class="chip">Compare</button>
			<SaveButton
				objectToSave={{
					arabic: sentence.arabic,
					english: sentence.english,
					transliterated: sentence.transliteration
				}}
				type="Sentence"
				className="!rounded-full !px-4 !py-2 !text-[0.83rem] !shadow-none"
			/>
			<button type="button" onclick={resetSentences} class="chip">Reset</button>
		</div>
	</div>

	<!-- Prompt -->
	<div class="prompt">
		<h3 class="prompt-words">
			{#each sentence.english.split(' ') as word, i (i)}
				<button type="button" onclick={() => askChatGTP(word)} class="word">{word}</button>
			{/each}
		</h3>

		{#if showHint}
			<p class="reveal">{sentence.transliteration}</p>
		{/if}
		{#if showAnswer}
			<p class="reveal reveal--ar font-arabic" dir="rtl">
				{showTashkeel && sentence.arabicTashkeel ? sentence.arabicTashkeel : sentence.arabic}
			</p>
		{/if}

		<!-- Record -->
		<div class="mt-8 flex flex-col items-center">
			<button
				type="button"
				onclick={toggleRecording}
				disabled={isTranscribing}
				class="mic {recording ? 'is-on' : ''}"
				aria-label={recording ? 'Stop recording' : 'Start recording'}
			>
				{#if recording}
					<AudioLoading />
				{:else}
					<svg class="h-11 w-11" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
						<path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
					</svg>
				{/if}
			</button>
			<p class="mic-label">
				{#if isTranscribing}
					Processing...
				{:else if recording}
					Tap to stop
				{:else}
					Tap to speak
				{/if}
			</p>
			<p class="mic-sub">
				{#if recording}
					Recording your voice...
				{:else}
					Say the sentence in Arabic
				{/if}
			</p>
		</div>
	</div>

	<!-- Result -->
	{#if isTranscribing}
		<div class="result flex flex-col items-center gap-3">
			<div class="h-10 w-10 animate-spin rounded-full border-4 border-tile-500 border-t-sky-500"></div>
			<p class="mic-sub">Analyzing your speech...</p>
		</div>
	{:else if transcribedText}
		{@const feedback = getFeedback(similarity)}
		<div class="result" style="--accent:{feedback.accent};">
			<div class="text-center">
				<p class="score">{Math.round(similarity)}%</p>
				<p class="score-label">{feedback.text}</p>
				<div class="score-track" aria-hidden="true">
					<div class="score-fill" style="width:{Math.max(0, Math.round(similarity))}%;"></div>
				</div>
			</div>

			<div class="result-row">
				<p class="result-label">You said</p>
				<p class="result-ar font-arabic" dir="rtl">{transcribedText}</p>
			</div>

			{#if showAnswer}
				<div class="result-row">
					<p class="result-label">Expected</p>
					<p class="result-ar font-arabic" dir="rtl">
						{showTashkeel && sentence.arabicTashkeel ? sentence.arabicTashkeel : sentence.arabic}
					</p>
				</div>
			{/if}

			<div class="mt-6 flex justify-center">
				<button
					type="button"
					onclick={() => { transcribedText = ""; similarity = 0; }}
					class="press px-7 py-3"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Try again
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		margin-bottom: 1.25rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 0.95rem;
		border-radius: 100px;
		font-size: 0.83rem;
		font-weight: 600;
		color: var(--text2);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
		transition:
			transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
			background 0.18s ease,
			border-color 0.18s ease,
			color 0.18s ease;
	}
	.chip:hover {
		transform: translateY(-2px);
		border-color: var(--tile6);
		color: var(--text1);
	}
	.chip.is-on {
		background: #0ea5e9;
		border-color: #0369a1;
		color: #fff;
	}

	.prompt {
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1.75rem 1.25rem 2rem;
		text-align: center;
	}
	.prompt-words {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.1rem;
		font-size: clamp(1.4rem, 4vw, 1.9rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}
	.word {
		padding: 0.1rem 0.3rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.word:hover {
		background: var(--tile5);
	}
	.reveal {
		margin-top: 0.9rem;
		font-size: 1.05rem;
		font-style: italic;
		color: var(--text2);
	}
	.reveal--ar {
		font-size: 1.7rem;
		font-style: normal;
		color: var(--text1);
	}

	/* Mic — a big press button that stays down while recording */
	.mic {
		display: grid;
		place-items: center;
		width: 6.5rem;
		height: 6.5rem;
		border-radius: 50%;
		color: #fff;
		background: #f43f5e;
		box-shadow: 0 6px 0 #9f1239;
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}
	.mic:hover:not(:disabled) {
		filter: brightness(1.06);
	}
	.mic:active:not(:disabled),
	.mic.is-on {
		transform: translateY(6px);
		box-shadow: 0 0 0 #9f1239;
	}
	.mic.is-on {
		animation: ring 1.4s ease-out infinite;
	}
	.mic:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.mic-label {
		margin-top: 1.1rem;
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text1);
	}
	.mic-sub {
		margin-top: 0.2rem;
		font-size: 0.85rem;
		color: var(--text2);
	}

	/* Result */
	.result {
		margin-top: 1.25rem;
		border-radius: 1.1rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1.5rem 1.25rem;
	}
	.score {
		font-size: 2.8rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--accent);
	}
	.score-label {
		margin-top: 0.35rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text1);
	}
	.score-track {
		margin: 0.9rem auto 0;
		max-width: 16rem;
		height: 0.55rem;
		border-radius: 100px;
		background: var(--tile5);
		overflow: hidden;
	}
	.score-fill {
		height: 100%;
		border-radius: 100px;
		background: var(--accent);
	}

	.result-row {
		margin-top: 1.25rem;
		padding-top: 1.1rem;
		border-top: 2px solid var(--tile5);
		text-align: center;
	}
	.result-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text2);
	}
	.result-ar {
		margin-top: 0.4rem;
		font-size: 1.6rem;
		line-height: 1.6;
		color: var(--text1);
	}

	.press {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: #0ea5e9;
		box-shadow: 0 4px 0 #0369a1;
		cursor: pointer;
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease,
			filter 0.2s ease;
	}
	.press:hover {
		filter: brightness(1.06);
	}
	.press:active {
		transform: translateY(4px);
		box-shadow: 0 0 0 #0369a1;
	}

	@keyframes ring {
		0% {
			box-shadow: 0 0 0 0 color-mix(in srgb, #f43f5e 45%, transparent);
		}
		100% {
			box-shadow: 0 0 0 1.1rem color-mix(in srgb, #f43f5e 0%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chip,
		.mic,
		.press {
			transition: none;
		}
		.chip:hover {
			transform: none;
		}
		.mic.is-on {
			animation: none;
		}
	}
</style>
