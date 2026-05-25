# Arabic Reading Display

Use this skill whenever rendering Arabic text that learners should read, with word-level interaction, drag-to-define, and EN/Transliteration/Tashkeel toggles.

## Canonical implementation

**Source of truth:** `src/routes/generated_story/[id]/+page.svelte`

**Core components:**
- `src/lib/components/dialect-shared/story/components/ArabicWordDisplay.svelte` — Arabic word cards with drag-to-select and click-to-define
- `src/lib/components/dialect-shared/story/components/Sentence.svelte` — Clickable English words with drag-to-select
- `src/lib/components/AudioButton.svelte` — TTS playback

---

## Required data shape

```typescript
type Sentence = {
  arabic: { text: string; speaker?: string }
  arabicTashkeel?: { text: string }
  english: { text: string }
  transliteration: { text: string }
  wordAlignments?: { arabic: string; english: string; transliteration: string }[]
}
```

`wordAlignments` unlocks the rich word-card display (transliteration above + English label above Arabic). Without it, `ArabicWordDisplay` falls back to plain Arabic word buttons.

---

## The sentence card pattern

Each sentence is wrapped in a `<section class="bg-tile-400 border-2 rounded-xl p-6 border-tile-600">` with this structure:

```
┌─ section card ─────────────────────────────────────────┐
│ [speaker label if present]                              │
│                                                         │
│ [English — Sentence component, toggle-able]            │
│ ─────────────────────────────────────────              │
│ [Transliteration — plain text, toggle-able]            │
│                                                         │
│ [ArabicWordDisplay — word cards, drag-to-select]       │
│                                                         │
│ ── footer ─────────────────────────────────────────── │
│  Sentence N of M    [EN] [Trans] [Tashkeel] [Audio]   │
└────────────────────────────────────────────────────────┘
```

---

## State required

```typescript
// Global toggles (default on)
let showEnglish = $state(true);
let showTransliteration = $state(true);
let showTashkeel = $state(false);

// Per-sentence overrides (null = follow global)
let sentenceOverrides = $state<Record<number, { english?: boolean; transliteration?: boolean; tashkeel?: boolean }>>({});

// Active word for DefinitionModal / side panel
let activeWord = $state<{ arabic: string; english: string; transliterated: string; description: string; isLoading: boolean; type: string } | null>(null);
```

---

## Wiring ArabicWordDisplay

```svelte
<ArabicWordDisplay
  {sentence}
  setActiveWord={(word) => activeWord = word}
  dialect={dialect}
  showEnglish={sentenceEnglish}
  showTransliteration={sentenceTransliteration}
  showTashkeel={sentenceTashkeel}
/>
```

`setActiveWord` receives an object with `{ arabic, english, transliterated, description, isLoading, type }`. Pass it to `DefinitionModal` or a side panel.

---

## Footer toggle buttons

```svelte
<button
  onclick={() => toggleSentenceEnglish(sentenceIndex)}
  class={cn("text-xs transition-opacity",
    sentenceEnglish ? "opacity-40 hover:opacity-70" : "opacity-20 hover:opacity-50 line-through"
  )}
>EN</button>

<button
  onclick={() => toggleSentenceTransliteration(sentenceIndex)}
  class={cn("text-xs transition-opacity",
    sentenceTransliteration ? "opacity-40 hover:opacity-70" : "opacity-20 hover:opacity-50 line-through"
  )}
>Trans</button>

{#if sentenceHasValidTashkeel(sentence)}
  <button
    onclick={() => toggleSentenceTashkeel(sentenceIndex)}
    class={cn("text-xs transition-opacity",
      sentenceTashkeel ? "opacity-40 hover:opacity-70" : "opacity-20 hover:opacity-50 line-through"
    )}
  >Tashkeel</button>
{/if}

<AudioButton text={sentence.arabic.text} {dialect} />
```

Visible = `opacity-40 hover:opacity-70`. Hidden = `opacity-20 line-through`. Never remove the button — always toggle visibility.

---

## Definition lookup

`ArabicWordDisplay` calls `askChatGTP` from `src/lib/components/dialect-shared/story/helpers/ask-chat-gpt.ts`, which hits `/api/definition-sentence`. The response is a JSON string stored as `description` in the active word object. `DefinitionModal` parses it.

For components that don't use `ArabicWordDisplay` directly, call `/api/definition-sentence` with:
```typescript
{
  question: `What does ${word} mean in ${dialectName}? Context: Arabic: "${sentence.arabic}", English: "${sentence.english}"`,
  isSingleWordDefinition: true // single word
}
```

---

## Tashkeel validity check

```typescript
function sentenceHasValidTashkeel(sentence): boolean {
  return !!(sentence.arabicTashkeel?.text && sentence.arabicTashkeel.text.trim() !== sentence.arabic.text.trim());
}
```

Only show the Tashkeel toggle if tashkeel is present and different from the plain Arabic.

---

## Key rules

1. **Never show a wall of text** — always split into interactive word buttons.
2. **Drag to select a phrase** — `ArabicWordDisplay` handles this natively with `onmousedown`/`onmouseenter`/`onmouseup`.
3. **Toggle, never remove** — EN/Trans/Tashkeel are toggles, not permanent choices.
4. **Audio always visible** — `AudioButton` is never hidden.
5. **Always use `ArabicWordDisplay`** for Arabic words — never render plain Arabic text that learners need to study.
