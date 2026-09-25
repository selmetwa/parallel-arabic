# Fix drag-to-define on mobile

## Context
Drag-to-define (drag across words, then define the phrase) is built only on mouse events: `onmousedown` and `onmouseenter` on each word, plus `onmouseup` on the container. On touch devices this can't work:
- A touch drag scrolls the page. Browsers only send emulated mouse events *after* a tap ends, so `mouseenter` never fires on the other words during a drag. Only single-word taps work.
- Holding a word brings up the iOS callout or Android context menu.
- Separate desktop bug: `mouseup` is only listened for on the container, so releasing outside it leaves `isSelecting` stuck at true. The selection then keeps growing on hover.

The same logic is copied into 7 components (about 10 word containers).

**Decision (confirmed):** on touch, **long-press (~250ms) starts the drag**. A quick swipe still scrolls, and a tap still defines one word.

## Approach
Add one Svelte action that handles mouse and touch for a whole word container. Each word is found by a `data-word-index` attribute through `document.elementFromPoint`. This is required because a touch keeps sending events to the element it started on, so per-word enter events never fire. The component-side change at each call site is mechanical. Each component keeps its own selection state and functions.

Installed Svelte is 5.22.6, which does not have `{@attach}` (added in 5.29), so this uses `use:`.

### 1. New `src/lib/actions/word-drag-select.ts`
```ts
type Options = { onStart: (i: number) => void; onExtend: (i: number) => void; onEnd: () => void };
export function wordDragSelect(node: HTMLElement, options: Options): { update; destroy }
```
- `indexAt(x, y)`: calls `document.elementFromPoint(x, y)?.closest('[data-word-index]')`, keeps the result only if `node.contains(el)`, and returns the index as a Number (or -1).
- **Mouse:** on `mousedown` over a word: `preventDefault()` (as the current handlers do), set `selecting`, call `onStart(i)`. On `window` `mousemove` while selecting: call `onExtend(indexAt(...))` whenever the index changes. On `window` `mouseup`: call `onEnd()`. Listening on `window` fixes the stuck-selection bug.
- **Touch:** on `touchstart` (passive) over a word, record the start point and start a 250ms timer.
  - A `touchmove` of more than 10px before the timer fires cancels it. The browser scrolls as usual.
  - When the timer fires: set `selecting`, call `onStart(i)`, and call `navigator.vibrate?.(10)` for haptic feedback.
  - `touchmove` is added with `{ passive: false }`. While selecting it calls `preventDefault()` (this blocks scrolling) and `onExtend(indexAt(touch.clientX, touch.clientY))`.
  - On `touchend`/`touchcancel`: clear the timer. If selecting, `preventDefault()` so the emulated mouse events and click don't also define the single word under the finger, then call `onEnd()`.
- `contextmenu` on the node: `preventDefault()` while a long-press is pending or active (Android).
- Set `node.style.webkitTouchCallout = 'none'` to stop the iOS callout and magnifier. Containers already have `select-none`.
- `update(newOptions)` swaps the callbacks. `destroy` removes all listeners and clears the timer.

### 2. Changes at each call site (same pattern everywhere)
- Word element: remove `onmousedown` and `onmouseenter`, and add `data-word-index={index}`. Keep `onclick` and `onkeydown`, so tap or click to define works as before.
- Container: replace `onmouseup={handleXMouseUp}` with
  `use:wordDragSelect={{ onStart: handleXMouseDown, onExtend: handleXMouseEnter, onEnd: handleXMouseUp }}`
- Handler: remove the `event: MouseEvent` parameter and its `preventDefault()` from `handleXMouseDown`, since the action does this now. Leave the rest of each component's selection logic unchanged.

Files:
- `src/lib/components/dialect-shared/sentences/SentenceBlock.svelte` (~492, ~723)
- `src/lib/components/dialect-shared/story/components/Sentence.svelte`: one container (~398) with 3 word loops
- `src/lib/components/dialect-shared/story/components/ArabicWordDisplay.svelte`: 2 loops, container ~248
- `src/lib/components/dialect-shared/vocab/WriteWordBlock.svelte` (~457)
- `src/lib/components/LessonPlayer.svelte` (~874)
- `src/lib/components/SelfStudyPlayer.svelte`: writing prompt words (~665)
- `src/routes/review/components/ReviewCard.svelte`: two Arabic containers (`handleArabicWord*`) and one English container

Optional copy tweak: `SelfStudyPlayer.svelte:494` shows "Click to define · drag to select a phrase" only at `sm:` sizes. Leave it as is unless you want a mobile hint like "Tap to define · hold and drag for a phrase".

## Verification
1. `npm run check` (svelte-check) passes. Run the svelte-autofixer MCP on each edited component.
2. Desktop (user verifies): click one word, which defines it. Drag across words, then check that the Define "…" button shows the phrase. Release outside the container and check that hover no longer extends the selection.
3. Mobile (real phone or DevTools touch emulation, user verifies), for a story sentence, SentenceBlock, and a ReviewCard:
   - A tap defines one word.
   - A quick swipe over the text scrolls the page.
   - Hold for about 250ms and drag: the words highlight as the finger moves, the page doesn't scroll, and no iOS callout or context menu appears.
   - Releasing shows the phrase Define button, and no single-word definition pops up.
   - Arabic (RTL) rows also select correctly, since hit-testing uses coordinates.
