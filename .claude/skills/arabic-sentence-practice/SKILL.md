# Arabic Sentence Practice (Typing + Reorder)

Use this skill whenever implementing Arabic writing/typing practice where the learner translates an English sentence into Arabic with real-time feedback.

## Canonical implementation

**Source of truth:** `src/lib/components/dialect-shared/sentences/SentenceBlock.svelte`
**Route:** `src/routes/sentences/+page.svelte`

---

## Two practice modes

### 1. Typing mode
Learner types the Arabic translation using a virtual or native keyboard. Each character is color-coded in real time (green = correct, red = incorrect).

### 2. Sentence reorder mode
Learner taps shuffled Arabic word tokens in the correct order to reconstruct the sentence. Beginner-friendly.

**Default:** Reorder (easier). User can switch to Typing.

---

## Required data shape

```typescript
type Sentence = {
  arabic: string        // clean Arabic, no diacritics — used as the answer key
  arabicTashkeel?: string  // same sentence with full tashkeel — for pronunciation display
  english: string
  transliteration: string
}
```

---

## Keyboard setup

The virtual keyboard is an `<arabic-keyboard>` web component. Always call `updateKeyboardStyle()` after mount and after toggling keyboard type to sync theme colors.

```typescript
import { updateKeyboardStyle } from '$lib/helpers/update-keyboard-style';
import type { Keyboard } from '$lib/types/index';

let keyboardContainer: HTMLDivElement | null = $state(null);
let useVirtualKeyboard = $state(true);

onMount(() => {
  // Mobile defaults to native
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    useVirtualKeyboard = false;
  }
  updateKeyboardStyle();

  // Poll virtual keyboard for changes (it doesn't fire native input events)
  document.addEventListener('keydown', checkInput);
  document.addEventListener('click', checkInput);
  const interval = setInterval(checkInput, 300);

  return () => {
    document.removeEventListener('keydown', checkInput);
    document.removeEventListener('click', checkInput);
    clearInterval(interval);
  };
});

function checkInput() {
  if (!useVirtualKeyboard || !keyboardContainer) return;
  const el = keyboardContainer.querySelector('arabic-keyboard') as Keyboard | null;
  const value = el?.getTextAreaValue?.();
  if (typeof value === 'string') compareInput(value);
}
```

```svelte
<div bind:this={keyboardContainer}>
  <button onclick={() => { useVirtualKeyboard = !useVirtualKeyboard; setTimeout(() => updateKeyboardStyle(), 0); }}>
    {useVirtualKeyboard ? '📱 Use native keyboard' : '⌨️ Use virtual keyboard'}
  </button>

  <div class={cn('block', { hidden: !useVirtualKeyboard })}>
    <arabic-keyboard showEnglishValue="true" showShiftedValue="true"></arabic-keyboard>
  </div>

  <textarea
    oninput={(e) => compareInput((e.target as HTMLTextAreaElement).value)}
    class={cn('...', { hidden: useVirtualKeyboard })}
    dir="rtl"
    placeholder="اكتب هنا..."
  ></textarea>
</div>
```

**Always reset the keyboard on sentence change:**
```typescript
const el = keyboardContainer?.querySelector('arabic-keyboard') as Keyboard | null;
el?.resetValue?.();
updateKeyboardStyle(el ?? undefined);
```

---

## Real-time correctness check

```typescript
import { normalizeArabicText, normalizeArabicTextLight } from '$lib/utils/arabic-normalization';

type Attempt = { letter: string; correct: boolean };
let attempt = $state<Attempt[]>([]);
let isCorrect = $state(false);

function compareInput(value: string) {
  const normalizedInput  = normalizeArabicText(value.trim());
  const normalizedTarget = normalizeArabicText(sentence.arabic.trim());

  // Per-character visual feedback (use light normalization for display)
  const lightInput  = normalizeArabicTextLight(value.trim());
  const lightTarget = normalizeArabicTextLight(sentence.arabic.trim());

  attempt = value.trim().split('').map((letter, i) => ({
    letter,
    correct: (lightInput[i] ?? '') === (lightTarget[i] ?? '')
  }));

  isCorrect = normalizedInput === normalizedTarget && normalizedInput.length > 0;
}
```

**Render character feedback — NEVER use `{@html}` (XSS risk). Always use `{#each}`:**
```svelte
<div dir="rtl">
  {#each attempt as { letter, correct }, i (i)}
    <span class={cn('text-2xl', { 'text-green-600': correct, 'text-red-500': !correct })}>{letter}</span>
  {/each}
</div>
```

`normalizeArabicText` (strict): strips diacritics + normalizes letter variants (أ/إ/آ→ا, ة→ه, etc.) — used for the correctness check.
`normalizeArabicTextLight` (light): strips diacritics only — used for character-by-character visual feedback.

---

## Controls bar

```svelte
<div class="flex flex-wrap items-center justify-center gap-2 p-3 bg-tile-400 rounded-xl border border-tile-500">
  <button onclick={toggleHint}   class={cn(..., showHint   ? 'bg-amber-600 text-white' : 'bg-tile-500 text-text-300 ...')}>
    {showHint ? 'Hide' : 'Show'} Hint
  </button>
  <button onclick={toggleAnswer} class={cn(..., showAnswer ? 'bg-amber-600 text-white' : 'bg-tile-500 text-text-300 ...')}>
    {showAnswer ? 'Hide' : 'Show'} Answer
  </button>
  {#if sentence.arabicTashkeel}
    <button onclick={toggleTashkeel} class={cn(...)}>
      {showTashkeel ? 'Hide' : 'Show'} Tashkeel
    </button>
  {/if}
  <AudioButton text={sentence.arabic} {dialect} />
</div>
```

Active state: `bg-amber-600 text-white shadow-md`. Inactive: `bg-tile-500 text-text-300 border border-tile-600 hover:bg-tile-600`.

---

## Sentence reorder mode

```typescript
let shuffledWords = $state<string[]>([]);
let selectedWords = $state<string[]>([]);
let reorderChecked = $state(false);
let reorderCorrect = $state(false);

function initShuffle() {
  const words = sentence.arabic.split(' ').filter(Boolean);
  let shuffled = [...words].sort(() => Math.random() - 0.5);
  while (shuffled.join(' ') === words.join(' ') && words.length > 1) {
    shuffled = [...words].sort(() => Math.random() - 0.5);
  }
  shuffledWords = shuffled;
}

function checkReorder() {
  const normalizedUser   = normalizeArabicText(selectedWords.join(' '));
  const normalizedTarget = normalizeArabicText(sentence.arabic);
  reorderCorrect = normalizedUser === normalizedTarget;
  reorderChecked = true;
}
```

Tapping an available word moves it to the answer area; tapping the last selected word removes it (undo).

---

## English word display with drag-to-define

The English prompt is split into individually clickable `<span>` elements. Drag across multiple words to select a phrase, then define it.

```svelte
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="flex flex-wrap gap-1 select-none" onmouseup={handleMouseUp} role="application">
  {#each sentence.english.split(' ') as word, i (i)}
    <span
      onmousedown={(e) => handleMouseDown(i, e)}
      onmouseenter={() => handleMouseEnter(i)}
      onclick={() => lookupWord(word)}
      role="button" tabindex="0"
      class={cn('p-1 rounded-lg border-2 cursor-pointer', {
        'bg-blue-100 border-blue-400': isWordSelected(i),
        'border-transparent hover:bg-tile-400 hover:border-tile-600': !isWordSelected(i)
      })}
    >{word}</span>
  {/each}
</div>
```

---

## Key rules

1. **Normalize for comparison, not for display** — show the user's raw input with color feedback; compare normalized versions.
2. **Virtual keyboard needs polling** — it does not fire DOM input events; use the 300ms interval + keydown/click listeners.
3. **Reset keyboard on sentence change** — call `el.resetValue()` and `updateKeyboardStyle()`.
4. **Never mark wrong on empty input** — only show red feedback when `value.trim().length > 0`.
5. **Award XP on correct** — POST to `/api/award-xp` with `{ eventType: 'sentence_correct' }` exactly once per sentence.
