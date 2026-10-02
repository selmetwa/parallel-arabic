# Redesign /sentences and /speak practice views to match the setup page

## Context
The setup screens on `/sentences` and `/speak` were redesigned. They use a flat, theme-aware language: `--tile*`/`--text*` tokens, 2px borders, 1.1rem radii, `.pick` cards with a coloured 3D drop-shadow, `.press` buttons, `.seg` segmented controls, `.chip` toggles and `.note` tinted callouts. The practice ("details") views that load after generation still use the older ad-hoc Tailwind look: `bg-green-100` banners, rainbow buttons, `RadioButton`, gradients and `shadow-lg`. They should look like they belong to the same page. Emoji also come out of the whole flow: the loading, error and limit screens, the generate buttons and the practice views.

## Approach
(First step on approval: copy this plan to `docs/practice-views-redesign.md`.)

Follow the existing idiom: each route keeps its own scoped `<style>`, and nothing is shared. Each practice component gets a scoped copy of the classes it needs (`.pick`, `.press`, `.chip`, `.seg-wrap/.seg`, `.note`, `.nav-btn`), copied from `src/routes/sentences/+page.svelte:834-1533`. No new shared stylesheet. Logic, props, analytics and state stay the same. Only markup and styles change.

Common building blocks used in all three components:
- **Toolbar**: Hint, Answer and Tashkeel become `.chip` toggles (sky `is-on`). Listen is a small sky `.press`. Compare is a `.chip`, and Reset is a quiet `.chip`. Pass `className` to `SaveButton` to tone it down to chip size (always pass `className`, per the JSDoc bug).
- **Prompt card**: the English sentence sits in a `tile3` card with a 2px `tile5` border and 1.1rem radius. Words get a hover tint, and drag-selected words get a sky tint instead of `bg-blue-200`. Transliteration and Arabic reveals appear below it as `.note` rows.
- **Feedback**: correct and incorrect banners use `.note--good` / `.note--bad`. The tint carries the meaning, so no emoji.

### 1. `src/lib/components/dialect-shared/sentences/SentenceBlock.svelte`
- Correct banner: `.note--good` row with a green `.press` Next button.
- The mode selector becomes a 3-column `.pick` grid with accents and inline SVG icons in the `pick-flag` slot:
  - Trace (sky): "Fill in the faded answer"
  - Typing (emerald): "Type it from memory"
  - Reorder (violet): "Arrange the words"
- The keyboard toggle becomes `.seg-wrap` (Virtual / Native), dropping 📱⌨️. "How does this work?" stays as a `.clear-btn`-style text link. The native textarea gets the `.vocab-input` styling.
- Reorder mode:
  - The answer zone is a dashed `.drop`-style area.
  - Word tiles are violet `.pick`-style tiles with a 3D shadow.
  - Undo, Clear and Check become `.press` buttons. Check is violet; Undo and Clear use the `press--off` neutral style.
  - The result is shown with `.note--good` / `.note--bad`, dropping 🎉/❌.
- `InfoDisclaimer` stays.

### 2. `src/lib/components/dialect-shared/sentences/SentenceQuiz.svelte`
- Banners become `.note--good` / `.note--bad`. The toolbar replaces the `Button` grid. The English prompt goes in the prompt card.
- Replace the four `RadioButton`s with a 2×2 grid of `.pick` buttons showing the Arabic text (`aria-pressed`, `dir="rtl"`). Once an option is picked, the selected card turns green if correct and rose if wrong.
- Change `handleClick` to take the value directly instead of `e.target.value`. Drop the now-unused `Button` and `RadioButton` imports.

### 3. `src/lib/components/dialect-shared/speak/SpeakSentence.svelte` (also used in `LessonPlayerV2.svelte:264`)
- The outer wrapper becomes width-neutral (`w-full`, no `max-w-7xl` or padding), so the route and lesson card control the width.
- The controls bar becomes the shared toolbar. The main area becomes the prompt card, with no gradients or `shadow-lg`.
- The record button is a large round rose `.press`-style mic with a 3D shadow. While recording it stays pressed down, and `AudioLoading` stays inside it.
- The score card is flat, and the score is coloured by the existing difficulty heat-ramp accents (green → red). `getFeedback` loses its `emoji` field.
- Try Again becomes a `.press`.

### 4. Routes
- `src/routes/sentences/+page.svelte`
  - Practice `<main>`: drop `bg-tile-300` and narrow from `max-w-7xl` to `max-w-3xl` to match the setup column. If the virtual keyboard looks cramped, widen to `max-w-4xl`.
  - Remove emoji:
    - ✍️ bounce emoji and 💡 tip emoji on the loading screen
    - 🙈 error and 🔒 limit emoji
    - 📝 on the Generate button
    - ✍️/📂 on the Text/File seg
    - `activeDialect?.flag` in the progress label and summary line
  - Delete the CSS this leaves unused: `.bounce-emoji`, `@keyframes bob`, `.tip-emoji`, `.msg-emoji`, and their reduced-motion entries.
- `src/routes/speak/+page.svelte`
  - Make the same emoji removals: ✍️ loading, 🙈, 🔒, 🎙️ on the button, ✍️/📂 seg, and the flag in the progress label and summary.
  - Wrap `<SpeakSentence>` in `mx-auto max-w-3xl px-5 py-8`.
  - Delete the CSS this leaves unused.
- Setup-screen emoji (dialect flags, `pick-flag`s, topic chips, the 🗂️ toggle, 📄 drop, How-It-Works) stay, because they belong to the setup page the user wants to match. Exception: the ✍️/📂 on the Text/File seg goes, as listed above.

## Verification
1. Run `npx svelte-check` and confirm no new errors in the 5 touched files. Run the Svelte MCP `svelte-autofixer` on each edited `.svelte` file until it reports no issues.
2. The user checks visually (no browser MCP screenshots), in light and dark themes:
   - `/sentences`: write mode in Trace, Typing and Reorder (virtual and native keyboard), plus quiz mode.
   - `/speak`: record and score.
   - The lesson player's Speak step.
   - The loading, error and limit screens.
3. Run `grep -nP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]'` over the 3 components and the loading/error/limit/launch sections of both routes, and confirm nothing is left there.
