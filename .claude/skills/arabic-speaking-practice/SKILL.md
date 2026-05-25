# Arabic Speaking Practice

Use this skill whenever implementing voice recording + pronunciation scoring for Arabic speaking exercises.

## Canonical implementation

**Source of truth:** `src/lib/components/dialect-shared/speak/SpeakSentence.svelte`
**Route:** `src/routes/speak/+page.svelte`

---

## How it works

1. Learner taps a **single toggle button** to start/stop recording (not separate start + stop buttons).
2. Audio is captured via `MediaRecorder` → WebM blob.
3. Blob is posted to `/api/speech-to-text` (Chirp 3 via Google Cloud).
4. Transcribed Arabic text is compared to the target using **Levenshtein edit distance** (character-level, not word-level).
5. A percentage similarity score and feedback label are shown.
6. Learner can try again or move on.

---

## Required data shape

```typescript
type SpeakingPrompt = {
  arabic: string         // the sentence to say (clean, no diacritics)
  english: string        // English translation shown above
  transliteration: string
  arabicTashkeel?: string // optional tashkeel version
}
```

---

## State

```typescript
let isRecording = $state(false);
let isTranscribing = $state(false);
let transcribedText = $state('');
let similarity = $state(0);
let mediaRecorder: MediaRecorder | null = $state(null);
let audioChunks: Blob[] = $state([]);
```

---

## Toggle record button

Use a **single button** that toggles — matching the UX of `SpeakSentence.svelte`:

```svelte
<button
  onclick={toggleRecording}
  disabled={isTranscribing}
  class="group flex flex-col items-center gap-4 p-8 rounded-3xl border-4 transition-all duration-300
    hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    {isRecording
      ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/30'
      : 'bg-tile-300/50 border-tile-500 hover:border-tile-600 hover:bg-tile-400/50'}"
>
  <div class="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
    {isRecording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-red-400 to-red-600'}">
    {#if isRecording}
      <!-- Stop icon: white square -->
      <div class="w-10 h-10 bg-white rounded-sm" aria-hidden="true"></div>
    {:else}
      <!-- Mic icon -->
      <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    {/if}
  </div>
  <span class="text-xl font-bold {isRecording ? 'text-red-500' : 'text-text-300'}">
    {isTranscribing ? 'Processing...' : isRecording ? 'Tap to Stop' : 'Tap to Speak'}
  </span>
  <span class="text-sm text-text-200">
    {isRecording ? 'Recording your voice...' : 'Say the sentence in Arabic'}
  </span>
</button>
```

---

## Recording logic

```typescript
async function toggleRecording() {
  if (isRecording) {
    mediaRecorder?.stop();
    isRecording = false;
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks = [...audioChunks, e.data];
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await processRecording();
      };
      recorder.start();
      mediaRecorder = recorder;
      isRecording = true;
    } catch {
      console.error('Microphone access denied');
    }
  }
}
```

---

## Speech-to-text API call

```typescript
async function processRecording() {
  isTranscribing = true;
  try {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('dialect', dialect);   // e.g. 'egyptian-arabic'
    formData.append('language', 'ar');     // IMPORTANT: 'language' not 'inputLanguage'

    const res = await fetch('/api/speech-to-text', { method: 'POST', body: formData });
    const data = await res.json();
    transcribedText = data.text || '';
    similarity = calculateSimilarity(transcribedText, targetSentence.arabic);
  } catch {
    transcribedText = '';
    similarity = 0;
  } finally {
    isTranscribing = false;
  }
}
```

**Field name is `language`, not `inputLanguage`** — the API reads `formData.get("language")`.

---

## Similarity scoring — Levenshtein (character-level)

```typescript
import levenshtein from 'fast-levenshtein'; // already in package.json

function calculateSimilarity(transcribed: string, target: string): number {
  // Remove periods (Whisper sometimes adds them), keep Arabic characters
  const clean = (t: string) => t.replace(/\./g, '');
  const a = clean(transcribed);
  const b = clean(target);

  if (a === b) return 100;
  if (!a || !b) return 0;

  const distance = levenshtein.get(b, a);         // edit distance
  const maxLen = Math.max(a.length, b.length);
  return (1 - distance / maxLen) * 100;            // 0–100 percentage
}
```

**Always use character-level Levenshtein, not word-level matching** — Arabic agglutination means word boundaries are unreliable. `fast-levenshtein` is already installed.

---

## Feedback display

```typescript
function getFeedback(score: number): { text: string; emoji: string; color: string } {
  if (score >= 90) return { text: 'Excellent!',       emoji: '🎉', color: 'text-green-700' };
  if (score >= 75) return { text: 'Great job!',       emoji: '👏', color: 'text-emerald-500' };
  if (score >= 60) return { text: 'Good effort!',     emoji: '👍', color: 'text-yellow-500' };
  if (score >= 40) return { text: 'Keep practicing!', emoji: '💪', color: 'text-orange-500' };
  return              { text: 'Try again!',           emoji: '🔄', color: 'text-red-500' };
}
```

```svelte
{#if !isTranscribing && transcribedText}
  {@const fb = getFeedback(similarity)}
  <div class="bg-tile-300/50 border-2 border-tile-500/50 rounded-2xl p-6 space-y-4">
    <!-- Score -->
    <div class="flex items-center justify-center gap-4">
      <span class="text-4xl">{fb.emoji}</span>
      <div class="text-center">
        <p class="text-4xl font-bold {fb.color}">{Math.round(similarity)}%</p>
        <p class="text-base font-semibold {fb.color}">{fb.text}</p>
      </div>
    </div>

    <!-- What you said -->
    <div class="border-t border-tile-500/30 pt-4">
      <p class="text-xs text-text-200 uppercase tracking-wider font-bold text-center mb-2">You said:</p>
      <p class="text-xl text-center font-arabic text-text-300" dir="rtl">{transcribedText}</p>
    </div>

    <!-- Try again -->
    <div class="flex justify-center">
      <button onclick={() => { transcribedText = ''; similarity = 0; }} class="px-6 py-2.5 bg-tile-500 hover:bg-tile-600 text-text-300 font-semibold rounded-xl transition-colors">
        Try Again
      </button>
    </div>
  </div>
{/if}
```

---

## Processing spinner (while transcribing)

```svelte
{#if isTranscribing}
  <div class="flex flex-col items-center gap-4 py-8" role="status" aria-live="polite">
    <div class="w-12 h-12 border-4 border-tile-500 border-t-tile-700 rounded-full animate-spin" aria-hidden="true"></div>
    <p class="text-lg text-text-200 font-medium">Analyzing your speech...</p>
  </div>
{/if}
```

---

## Sentence display before recording

Show the English meaning clearly, with the Arabic sentence and transliteration below. Audio button always present:

```svelte
<div class="bg-tile-400 border-2 border-tile-600 rounded-2xl p-5 shadow-md space-y-3">
  <p class="text-base text-text-200">{prompt.english}</p>
  <div class="flex items-center justify-between gap-3">
    <p class="text-2xl sm:text-3xl font-bold text-text-300 font-arabic text-right flex-1" dir="rtl">{prompt.arabic}</p>
    <AudioButton text={prompt.arabic} {dialect} />
  </div>
  <p class="text-sm text-text-200 italic">{prompt.transliteration}</p>
</div>
```

---

## Key rules

1. **Single toggle button** — never separate Start/Stop buttons.
2. **Character-level Levenshtein only** — `fast-levenshtein` is already installed; never use word-level matching for Arabic.
3. **`language` field, not `inputLanguage`** — the speech-to-text API reads `formData.get("language")`.
4. **Speaking is always skippable** — never require a score to advance. Show "Skip →" until recorded, then "Next →".
5. **Stop tracks after recording** — always call `stream.getTracks().forEach(t => t.stop())` to release the mic.
6. **Reset on step change** — clear `transcribedText`, `similarity`, `isRecording`, `isTranscribing` when navigating away.
