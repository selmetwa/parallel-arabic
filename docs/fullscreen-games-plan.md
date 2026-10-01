# Fullscreen game rounds under /learn/game

## Context
A game round currently plays inside the normal page. The mobile navbar, sidebar, footer and the long SEO sections (How to play, FAQ, More games) all stay around it. The goal is the same experience as the tutor's live conversation (`src/routes/tutor/+page.svelte:618-628, 1866-1869`): once play starts, the game takes over the screen as a `fixed inset-0 z-[60] h-dvh` overlay, the body scroll is locked, and a ← button exits.

Decisions confirmed with the user:
- Go fullscreen **when a round starts**, not on page load. The landing page and its SEO text stay as they are.
- **Hide the dialect/level/theme chips** in fullscreen. The overlay shows only a slim top bar (← exit, emoji + game name, free-rounds status) and the game.
- `/learn/game/play` (the quiz in progress) is game-only, so it is **always** fullscreen.

On implementation start, copy this plan to `docs/fullscreen-games-plan.md` (per the repo convention of keeping plans under docs/).

## Approach

### 1. `GameShell.svelte`: optional fullscreen mode (`src/lib/components/games/GameShell.svelte`)
- New props: `fullscreen?: boolean` (default false) and `onExitFullscreen?: () => void`.
- Keep `{@render children()}` in the **same tree position** and only toggle a class on the `.play-area` wrapper, the same way the tutor toggles classes. Moving it elsewhere would remount the game and lose its state. Word scramble enters fullscreen in the middle of a move, so its state has to survive the switch.
- When `fullscreen`:
  - `.play-area.fullscreen { position: fixed; inset: 0; z-index: 60; height: 100dvh; display: flex; flex-direction: column; background: var(--tile2) /* match page bg-tile-200 */ }`
  - Render a top bar inside it (`shrink-0`, `padding-top: env(safe-area-inset-top)`) with a ← button (calls `onExitFullscreen`, `aria-label="Exit fullscreen"`), `game.emoji` + `game.name`, and `status` when present.
  - The game goes in an inner scroll container (`flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain`), centred to `max-w-3xl` with the shell's existing horizontal padding and a safe-area bottom pad.
  - `$effect` body-overflow lock, copied from the tutor.
  - Escape key exits (`svelte:window onkeydown`), but only when no modal is open (`modal === null`).
- Modals already sit above the overlay (`Modal.svelte` defaults to z-index 100; the sidebar is z-40 and the chat widget z-50), so the auth and paywall modals still work during a round.

### 2. `GeneratedGamePage.svelte` (odd one out, spot the mistake, sentence scramble)
- `let fullscreen = $state(false)`.
- In `start()`, after the gate check passes, set `fullscreen = true` so the loading spinner already shows fullscreen. If `round.start()` returns false (error, auth or paywall), set it back to `false`. "Play again" calls `start()` too, so it stays fullscreen.
- Pass `fullscreen={fullscreen && (round.status === 'loading' || round.status === 'playing')}` and `onExitFullscreen={() => (fullscreen = false)}`.
- After the player exits, the round stays playable inline on the page as it is today. Pressing Start again re-enters fullscreen.

### 3. `WordGamePage.svelte` + `WordScramble.svelte` (word scramble)
- `WordScramble` has no Start button. A round begins on the first move (`beginRound()`, line ~52).
- Add an optional `onStart?: () => void` prop to `WordScramble` and call it inside `beginRound()` right after `started = true`.
- Add `onStart` to the `WordGameContext` passed to the snippet. `WordGamePage` sets its own `fullscreen = true` there, and passes `fullscreen` and `onExitFullscreen` to `GameShell`. The word-scramble route (`src/routes/learn/game/word-scramble/+page.svelte`) passes `{onStart}` through.
- `playAgain()` resets `started = false`, but fullscreen is tracked in `WordGamePage`, so play-again stays fullscreen.
- Check whether any other component consumes `WordGamePage` (only word scramble does today) and keep `onStart` optional.

### 4. `/learn/game/play` (`src/routes/learn/game/play/+page.svelte`)
- Wrap the existing `<section>` in `<div class="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-tile-200 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">`.
- Add the same body-overflow `$effect` lock.
- Add no new exit control. The page already has a back arrow in the progress row (line ~953), plus New Game / Go Back buttons that `goto('/learn/game/quiz')`.

### Out of scope
`/learn`, `/learn/game` and `/learn/game/quiz` (the setup screen) stay as normal pages.

## Files
- `src/lib/components/games/GameShell.svelte`: fullscreen props, top bar, styles, scroll lock
- `src/lib/components/games/GeneratedGamePage.svelte`: fullscreen state
- `src/lib/components/games/WordGamePage.svelte`: fullscreen state, `onStart` in context
- `src/lib/components/games/WordScramble.svelte`: `onStart` prop
- `src/routes/learn/game/word-scramble/+page.svelte`: pass `onStart`
- `src/routes/learn/game/play/+page.svelte`: fixed overlay wrapper and scroll lock

Run the Svelte autofixer (MCP) on each edited `.svelte` file.

## Verification
- `npm run check` (svelte-check) and `npm run lint`, with no new errors.
- `npm run test` (vitest). There are no game-shell tests, but this catches regressions in `$lib/games`.
- The user checks visually (no browser-MCP screenshots), on mobile and desktop widths:
  - Odd one out / spot the mistake / sentence scramble: Start → spinner and game fill the screen, with no navbar, sidebar or footer behind them and the page underneath not scrolling. Then ← exit, Play again, and Escape.
  - Word scramble: the first tile tap goes fullscreen and the tap still registers. Play again stays fullscreen.
  - Free rounds used up: the paywall or auth modal shows above the overlay, and a blocked start does not get stuck in fullscreen.
  - Quiz: `/learn/game/quiz` → start → `/learn/game/play` is fullscreen. The back arrow returns to setup and page scrolling works again.
