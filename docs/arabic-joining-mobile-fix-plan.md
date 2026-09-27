# Fix Arabic letter joining in Trace mode on mobile

## Context
In sentence practice → **Trace** mode, the dimmed target sentence (e.g. `انا بشرب قهوه كل يوم الصبح`) renders with disconnected letters on iPhone. Desktop Chrome looks fine.

Cause: `traceHtml` in `src/lib/components/dialect-shared/sentences/SentenceBlock.svelte:340-352` wraps **every character** in its own `<span>`, with `opacity-40` and `transition-opacity` on each. Chrome shapes Arabic across inline span boundaries. WebKit, which every iOS browser uses, doesn't: each span is shaped on its own. The `&zwj;&zwj;` workaround covers this only in part:
- It depends on `isSafari = getBrowserInfo()` (line 320), which is evaluated at script time. During SSR it is `false`, so the server HTML has no ZWJs.
- The per-span `opacity` / `transition-opacity` puts every letter in its own paint group, so glyphs whose shapes are correct still don't visually connect in WebKit.
- A span on every letter means there are 25+ boundaries per sentence, and each one can fail.

## Approach
Rewrite `traceHtml` so it produces as few spans as possible and joins properly without depending on the browser:

1. **Group consecutive characters that share a state into one span.** The states are almost always contiguous (a correct prefix, maybe some incorrect letters, then pending), so a sentence becomes about 1–3 spans instead of about 30. Letters inside a run are shaped natively by every engine.
2. **Put ZWJ only at run boundaries, and always.** Add `&zwj;` at the end of every run except the last and at the start of every run except the first. This keeps the correct joining form at the one or two places where the style changes. It is harmless in Chrome, and ZWJ next to a non-joining letter such as ا or د has no visual effect. Drop the `isSafari` branch for trace mode, which also fixes the SSR mismatch.
3. **Replace `opacity-40` with a color at alpha**: `text-text-300/40`, or the existing muted token if the `/40` modifier doesn't work with the custom color. Remove `transition-opacity duration-150` from the per-run classes. Only color changes per run, and color doesn't affect shaping or compositing.
4. Move the font size (`text-2xl sm:text-3xl`) from each run to the wrapping `<span class="font-arabic leading-loose">` at line 951, so the runs differ only by color.

Sketch:
```ts
let traceHtml = $derived.by(() => {
  const runs: { state: TraceState; text: string }[] = [];
  for (const { char, state } of traceChars) {
    const last = runs.at(-1);
    if (last && last.state === state) last.text += char;
    else runs.push({ state, text: char });
  }
  return runs
    .map(({ state, text }, i) => {
      const cls = cn({ 'text-text-300': state === 'correct', 'text-red-500': state === 'incorrect', 'text-text-300/40': state === 'pending' });
      const pre = i > 0 ? '&zwj;' : '';
      const post = i < runs.length - 1 ? '&zwj;' : '';
      return `<span class="${cls}">${pre}${escape(text)}${post}</span>`;
    })
    .join('');
});
```
(The existing code doesn't escape `char`. Sentences come from our own DB/LLM, so I'll keep the current behavior and won't add an escape helper unless one already exists.)

## Also fix the green/red "attempt" displays
Three places render the typed attempt as one span per letter, with an `{#if isSafari}` ZWJ branch and an `{:else}` plain branch:
- `SentenceBlock.svelte:953-978` (Typing mode)
- `WriteWordBlock.svelte:483-507`
- `ConjugationPractice.svelte:652-662`

Since four call sites use the same logic, move the run-grouping into one shared helper instead of copying it:

```ts
// src/lib/helpers/arabic-runs.ts
export function arabicRunsHtml<T>(items: T[], char: (t: T) => string, cls: (t: T) => string): string
```
It merges consecutive items that share a class string into one run, puts `&zwj;` only at the boundaries between runs, and returns the joined `<span>` HTML.

At each attempt call site, replace the whole `{#if isSafari}…{:else}…{/if}` block with one
`{@html arabicRunsHtml(attempt, a => a.letter, a => a.correct ? 'text-green-700' : 'text-red-500')}`
and leave the text size on the existing outer `<span>`. Remove `isSafari` / the `getBrowserInfo` import from any file where it is no longer used. The `getBrowserInfo` helper stays because other code may still use it; I'll grep before deciding.

Trace mode (step 1–3 above) uses the same helper with a state→class function.

## Files
- `src/lib/helpers/arabic-runs.ts` (new): the shared helper.
- `src/lib/components/dialect-shared/sentences/SentenceBlock.svelte`: `traceHtml` and the Typing `attempt` display. Move the text-size class onto the trace wrapper around line 951.
- `src/lib/components/dialect-shared/vocab/WriteWordBlock.svelte`: the `attempt` display.
- `src/lib/components/dialect-shared/conjugations/ConjugationPractice.svelte`: the `attempt` display.
- After approval, also copy this plan to `docs/` per repo convention.

## Verification
- Run `npx svelte-check` for this file, and run the Svelte autofixer on the edited component.
- For you to check on the iPhone in Safari or Chrome:
  - Trace mode with no input: the whole dimmed sentence is fully joined.
  - Type the first letters: the filled-in part and the dimmed remainder both stay joined across the boundary.
  - Type a wrong letter: it turns red and the neighbouring letters stay connected.
- Typing mode, vocab write-word, and conjugation practice on iPhone: type a mix of right and wrong letters, and the green and red letters stay joined to each other.
- Desktop Chrome: looks the same as before, apart from the smoother joining.
