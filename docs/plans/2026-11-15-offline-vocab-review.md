# Offline vocab review (FSRS review only)

## Context
Vocab review needs a connection for everything today:
- `/review` loads due words from `/api/review-words` when it opens, and each rating POSTs to `/api/review-word`.
- A failed rating shows "Your last rating didn't save…" and the rating is lost.
- There is no service worker:
  - `svelte.config.js` has `serviceWorker.register: false`.
  - `@vite-pwa/sveltekit` is installed but not wired into `vite.config`.
  - `static/manifest.json` isn't linked.
- The FAQ wrongly says many features work offline thanks to PWA support.

**Goal:** a learner can do their vocab review with no connection (on the subway, on a plane) and lose nothing. The deck is downloaded while online, ratings are scheduled on the device with FSRS, and they sync in order once the connection returns. This covers vocab review only; lessons come later.

**Builds on:** the FSRS review (PR #254, merged to master):
- `src/routes/review/+page.svelte`
- `src/routes/api/review-word/+server.ts`
- `src/routes/api/review-words/+server.ts`
- `src/lib/srs/fsrs.ts`

This plan branches from `origin/master` (branch `offline-review`). Step 0 of implementation: copy this plan to `docs/plans/2026-11-15-offline-vocab-review.md`.

## Defaults I'm assuming (call out any you want changed)
1. **Fully offline, not just "survives a dropped connection":** `/review` opens with no network in the browser or an installed PWA.
2. **What's downloaded:** today's session (due cards up to `daily_review_limit`, then new words), plus the cards due in the next 24 h. Re-downloaded on every online visit to `/review`.
3. **Audio:** cached for cards that have a recorded `audioUrl` (from the `word` table). Words that only play through text-to-speech have no audio offline; the button shows as unavailable.
4. **Native iOS app:** not in scope for this pass. The Capacitor app loads the live site in WKWebView, and service workers there need App-Bound Domains (`WKAppBoundDomains`), which is its own change. The rating queue (step 2) still protects iOS app users from dropped connections. Android's WebView and mobile/desktop browsers get full offline support.
5. **Free tier (5 lifetime reviews):** the offline deck is only downloaded for subscribers. Free users keep today's online behaviour.

## 1. On-device store: `src/lib/srs/offline-store.ts` (new)
- A small IndexedDB wrapper with no new dependency: one database (`pa-review`) with two object stores. Every call is wrapped in try/catch, and falls back to in-memory when IndexedDB is unavailable (private mode).
- **`deck`** is keyed by `userId`: `{ userId, savedAt, words: ReviewWord[], counts, forecast, totalSavedWordsCount }`. It's written after every successful `/api/review-words` fetch.
- **`outbox`** holds pending ratings, in order: `{ id: uuid, userId, savedWordId, rating, reviewedAt }`.
- Exports: `saveDeck`, `loadDeck`, `queueReview`, `pendingReviews`, `removeReviews(ids)`, `clearUser(userId)`.
- Replaces the `review-progress` localStorage resume. The session's practice ("Again") entries and stats move into the deck record, so there's one source of truth.

## 2. Ratings always go through the outbox: `src/lib/srs/review-sync.ts` (new)
- **`rate()` in `/review`** works the same online and offline:
  1. Compute the new card locally with `schedule(wordToCard(word), rating, now)` (`src/lib/srs/fsrs.ts`).
  2. Write the result into the deck word (`cardToRow`), so the word leaves today's due list even before it syncs.
  3. `queueReview(...)`.
  4. `sync()`.

  The "Again" requeue stays as it is.
- **`sync()`** sends all pending reviews to `POST /api/review-words/sync` in `reviewedAt` order, in chunks of 50, and removes the acknowledged ids. It runs:
  - on page load,
  - on the `online` event,
  - after each rating,
  - on `visibilitychange` to visible.

  It's single-flight, so it never runs twice at once.
- **XP** moves to the server: the sync endpoint awards `review_correct` for each newly applied review with rating > 1 (`awardXp` from `src/lib/helpers/award-xp.ts`). It returns the totals so the page can update `userXp` and show the toast once per sync, instead of once per POST.
- The session-complete XP (`review_cycle`) still uses `/api/award-xp` when online; when offline it's queued as a flag and sent on the next sync.

## 3. Sync endpoint: `src/routes/api/review-words/sync/+server.ts` (new)
`POST { reviews: [{ id, saved_word_id, rating, reviewed_at }] }`

- **Auth and paywall:** same as `/api/review-word`. Non-subscribers past 5 reviews get 403 `requiresSubscription`. Subscription is checked once per request.
- **Order and idempotency:**
  - Process reviews in `reviewed_at` order.
  - Skip any `id` already in `word_review`, which makes retries safe. The client's uuid becomes `word_review.id`.
- **Scheduling at the original time:**
  - `schedule(rowToCard(row), rating, new Date(reviewed_at))`.
  - `reviewed_at` is clamped to no later than now, and to no earlier than 30 days ago or the row's `last_review_date`. A word reviewed on another device after this rating still gets the log row, but its schedule isn't rewound.
- **Writes** match `/api/review-word`: update `saved_word` via `cardToRow`, insert `word_review` (rating, fsrs snapshot, dialect), and record activity.
- **Testability:** the ordering, clamping and idempotency logic is a pure function, `applyReviews(rows, reviews, existingIds, now)`, in `src/lib/server/srs-sync.ts`.
- **`/api/review-word`** stays for compatibility (older clients), refactored to call the same helper.

## 4. Service worker: `src/service-worker.ts` (new, SvelteKit native)
- Turn on registration in `svelte.config.js` (`serviceWorker.register: true`). The native app loads the live site, so this reaches Android's WebView too; iOS's WKWebView ignores it until App-Bound Domains ship in a future binary.
- **Precache:** the app shell and the build/static files from `$service-worker` (`build`, `files`, `version`). Old version caches are deleted on `activate`.
- **`/review` page and its `__data.json`:** network-first. Every successful response is cached; when offline, the cached copy is served.
- **Other pages:** network only, with an offline fallback page that links to `/review`.
- **Audio:** cache-first for recorded audio files (Supabase storage URLs), capped at about 300 entries. After saving the deck, `/review` posts the deck's `audioUrl`s to the service worker to prefetch them in the background.
- **Logout:** when the worker sees a request to `/auth/logout`, it deletes the page/data/audio caches and clears that user's IndexedDB records, so a shared device doesn't keep the previous learner's deck.
- **Manifest:** link `static/manifest.json` in `src/app.html` so the site can be installed.

## 5. `/review` page changes (`src/routes/review/+page.svelte`)
- **`loadWords()`:**
  - Online: fetch the deck, `saveDeck`, then prefetch audio.
  - Offline, or when the fetch fails: `loadDeck(userId)`. Rebuild the queue from words still due by their local `nextReviewDate`, plus the saved practice entries.
  - With no cached deck: show "Connect once to download your review deck."
- **Status line** under the header:
  - "Offline · 7 reviews will sync when you're back online", when anything is pending.
  - A quiet "Synced" after a sync succeeds.
  - This replaces the `saveError` message.
- **Network-only tools are hidden or disabled while offline:** "Compare across dialects", tap-to-define, and the generate/import actions. Audio is disabled only when no cached file exists.
- **Done screen and counts** while offline come from the deck, with the forecast recomputed locally from the deck words' due dates.

## 6. Copy fix
- `src/routes/faq/+page.svelte` (the `offline` entry): "Vocab review works offline once you've opened it online on that device; everything else needs a connection."

## Critical files
- **New:**
  - `src/lib/srs/offline-store.ts`
  - `src/lib/srs/review-sync.ts`
  - `src/lib/server/srs-sync.ts` (+ `.test.ts`)
  - `src/routes/api/review-words/sync/+server.ts`
  - `src/service-worker.ts`
- **Edited:**
  - `src/routes/review/+page.svelte`
  - `src/routes/api/review-word/+server.ts` (uses the shared helper)
  - `svelte.config.js`
  - `src/app.html` (manifest link)
  - `src/routes/faq/+page.svelte`
- **Reused:**
  - `schedule`, `rowToCard`, `cardToRow`, `wordToCard` (`src/lib/srs/fsrs.ts`)
  - `awardXp` (`src/lib/helpers/award-xp.ts`)
  - `getUserHasActiveSubscription`, `getUserReviewCount`
  - `trackActivitySimple`

## Verification
- **Unit tests (vitest):**
  - `applyReviews`: in-order scheduling at `reviewed_at`; a duplicate id is skipped; future and too-old timestamps are clamped; a review older than `last_review_date` logs without rescheduling; the free-tier cutoff.
  - The outbox's local scheduling: a word rated offline leaves the due list and matches what the server computes for the same input.
- **Static checks:** `npm run check` (no new errors over the baseline), `npm run test:unit`, and `npm run build`. The native app needs no new binary.
- **Manual in Chrome (the user checks visually):**
  1. Open `/review` online and confirm the deck is saved (Application → IndexedDB).
  2. DevTools → Network → Offline, reload `/review`: the page loads, cards play, and recorded audio plays.
  3. Rate 5 cards offline: the "5 reviews will sync" line shows; close the tab.
  4. Go back online and reopen: it syncs, and `word_review` has 5 rows with the offline `reviewed_at` times. Check via the read-only Supabase MCP.
  5. `next_review_date` matches the intervals the buttons showed, and XP was awarded once per correct rating.
  6. Repeat a sync with the same outbox (simulate a retry): no duplicate rows.
  7. Log out: caches and IndexedDB are cleared.
