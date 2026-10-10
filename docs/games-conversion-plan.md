# Games conversion fixes (/learn/game)

## Context
`/learn/game` is the busiest route after the home page, but the way from a game to an account is leaky:
- The free-round gate opens `AuthModal` ("Login Required" → `/login`), and every login/signup sends people to `/` or `/?newSignup=true`, so they lose the game.
- Signed-out players earn no XP and save no missed words, and nothing tells them so.
- The paywall in games sells lessons/tutor/videos, not games.
- The hub opens with an SEO paragraph and 17 equal cards — no obvious first step.

Goal: fix all five points from the review. Event tracking is out of scope.
On execution, copy this plan to `docs/games-conversion-plan.md` (repo convention).

## 1. Gate → sign-up → back to the game
**`src/lib/helpers/safe-next.ts` (new, + test):** `safeNext(value, fallback = '/')` — accept only paths starting with `/` and not `//` or `/\`; otherwise fallback. Also `withNewSignup(path)` that appends `newSignup=true` with the right `?`/`&`.

**`AuthModal.svelte`:** add optional props `title`, `message`, `next`. Default copy stays the same for its 4 other callers. Buttons: primary "Create a free account" → `/signup?next=…`, secondary "I already have an account" → `/login?next=…`. `next` defaults to `page.url.pathname + page.url.search`.
**`GameShell.svelte`:** pass game-specific copy: title "Keep playing {game.name}", message "You've played your free rounds. Make a free account for two more rounds of every game, XP and a streak." (no "AI").

**Carry `next` through every auth path** (all use `safeNext`):
- `signup/+page.server.ts` & `login/+page.server.ts`: `load` redirects a signed-in visitor to `next`; the form actions read `next` from a hidden input. Signup with a session → `withNewSignup(next)`; login → `next`.
- `signup/+page.svelte` & `login/+page.svelte`: hidden `next` input in the forms. For web Google/Apple sign-in, `next` goes in a 10-minute `pa_next` cookie (`rememberNext`) that `/auth/callback` reads and clears. `redirectTo` is unchanged, because a query string might not match Supabase's redirect allow list. Native sign-in navigates to `next`. Links between login ↔ signup keep `next`.
- `auth/callback/+server.ts`, `auth/callback-supabase/+server.ts`, `api/auth/google/callback/+server.ts`: new users go to `withNewSignup(next)` instead of `/?newSignup=true`; returning users to `next`.

Onboarding is triggered by `?newSignup=true` on any page (`src/routes/+layout.server.ts:38`), so new users get onboarding over the game page and land back in the game after it — no onboarding changes needed.

## 2. Results-screen nudge + keep the round
**`GameResults.svelte`:** new optional props `signedIn` (default true, so nothing changes until a game opts in), `wouldEarnXp`, `missedCount`. When `!signedIn` show a card under the stats: "You'd have earned +{xp} XP and saved {n} missed words to review." + button "Create a free account to keep them" → `/signup?next=<current page>`. Lines drop out when a value is 0.

**`src/lib/games/pending-round.ts` (new, + test):** `rememberRound(store, { xp, words, dialect })` keeps the signed-out player's latest unsaved rounds in localStorage (append, cap XP at e.g. 30 and words at 20, expire after 24 h); `takePendingRound(store)` returns and clears it. Pure functions with injected storage, like `free-rounds.ts`.
**Flush:** in `GameShell.svelte`, on mount when signed in, `takePendingRound` → call `awardGameXp()` per XP point (existing serial queue in `src/lib/games/game-xp.ts`) and `saveMissedWords()` (`src/lib/games/save-missed.ts`); show a one-line banner "Your last round is saved: +N XP, M words in review."

**Each game with `GameResults`** (14: SpeedRound, WordScramble, ListenAndSpell, MemoryPairs, LetterHunt, DialectMatch, VerbBlitz, FillTheGap, OddOneOut, SpotTheMistake, SentenceScramble, Shadowing, RoomHunt, ScenarioPlayer): pass `{signedIn}`, `wouldEarnXp` = correct answers capped the same way `xpEarned` is (e.g. `Math.min(correct, MAX_XP_PER_ROUND)` in SpeedRound), `missedCount` where the game tracks missed words; at round end, if `!signedIn`, call `rememberRound`. Games with no correct-answer count (e.g. Shadowing) pass only `signedIn` and get a plain "Make a free account to track XP and your streak" line.

## 3. Paywall that sells games
**`PaywallModal.svelte`:** optional `gameName` prop. When set, the header reads "Unlimited {gameName}" and the first list item is "**All {GAMES.length} games, unlimited:** {gameName}, Speed Round, Room Hunt, …" before the existing items. Other 21 callers unchanged.
**`GameShell.svelte`:** pass `gameName={game.name}`. Quiz page (`learn/game/quiz/+page.svelte`) passes `gameName="the Quiz"`.

## 4 & 5. Hub page (`src/routes/learn/game/+page.svelte`)
New order:
1. Short `h1` + one-line sub ("Short Arabic games. Two free rounds of each, no account needed.").
2. **Dialect chips** (reuse `DIALECT_OPTIONS` from `src/lib/games/themes.ts`) — the choice is saved in localStorage (try/catch) and added as `?dialect=` to every game link, which `initialDialect` already reads. Signed-in default: `targetDialect`.
3. **Today hero:** the existing Today card made big, with a "Play today's challenge →" button.
4–5. **Grid grouped by level** (replaces the single grid). Each section has a heading and a one-line note, in this order:
   - **New to Arabic? Start here** (absolute beginner / beginner): Letter Hunt, Room Hunt, Memory Pairs
   - **Beginner to intermediate**: Scenarios, Word Scramble, Speed Round, Listen & Spell, Shadowing, Verb Blitz
   - **Intermediate**: Daily Root
   - **All levels** (difficulty adjusts): Odd One Out, Spot the Mistake, Sentence Scramble, Dialect Match, Fill the Gap, Quiz

   Done with a `levelGroup(levels)` helper in `src/lib/constants/games.ts` that maps the existing `levels` strings (`'Absolute beginner'`, `'Beginner'` → start here; `'Beginner–Intermediate'` → beginner to intermediate; `'Intermediate'` → intermediate; `'Beginner–Advanced'`, `'A1–C2'` → all levels), plus a `GAME_LEVEL_GROUPS` list for order and headings. Tested so every game lands in exactly one group. If Intermediate looks thin with one game, it can be merged into "Beginner to intermediate" as "Intermediate and up" — easy to change later.
6. The long SEO intro paragraph moves under the grid as an "About these games" section (text kept), then "Games by skill", FAQs and the footer as today.

GameShell's `onDialectChange` also saves the dialect to the same localStorage key, so the hub remembers the last dialect played.

## Files
New: `src/lib/helpers/safe-next.ts`, `src/lib/games/pending-round.ts` (+ tests).
Changed: `AuthModal.svelte`, `PaywallModal.svelte`, `games/GameShell.svelte`, `games/GameResults.svelte`, the 14 game components, `routes/learn/game/+page.svelte`, `routes/learn/game/quiz/+page.svelte`, `src/lib/constants/games.ts`, login + signup pages/servers, the three auth callbacks.

## Verification
- `npm run test` (new unit tests: `safeNext` rejects `//evil.com`, `https://…`, `/\\x`; pending-round caps/expiry; level grouping) and `npm run check` — no new type errors (`className=""` on any new `SaveButton`).
- svelte-autofixer on every edited `.svelte` file.
- Manual (user verifies in the browser): signed out, play a game 3 times → modal says "Keep playing …" → sign up with email and Google → lands back on the same game with onboarding, then the "round saved" banner and XP; log in from the modal → back on the game; signed in without a subscription, use up rounds → paywall leads with games; hub shows dialect chips, Today hero, starter row, grouped grid, and game links carry `?dialect=`.
