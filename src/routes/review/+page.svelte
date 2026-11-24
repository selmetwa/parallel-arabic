<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import ReviewCard from './components/ReviewCard.svelte';
  import GenerateWordsModal from '$lib/components/review/GenerateWordsModal.svelte';
  import GenerateSentencesModal from '$lib/components/review/GenerateSentencesModal.svelte';
  import ImportWordsModal from '$lib/components/review/ImportWordsModal.svelte';
  import DueForecast from '$lib/components/review/DueForecast.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { PageData } from './$types';
  import { userXp, userLevel } from '$lib/store/xp-store';
  import { showXpToast } from '$lib/helpers/toast-helpers';
  import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import SubscribeButton from '$lib/components/SubscribeButton.svelte';
  import { trackEvent } from '$lib/analytics';
  import { previewIntervals, State, wordToCard, type Rating, type ReviewWord } from '$lib/srs/fsrs';
  import { loadDeck, pendingReviews, queueReview, saveDeck, type Deck, type SessionState } from '$lib/srs/offline-store';
  import { applyRating, dueFromDeck, forecastFromWords, syncReviews, withPatch } from '$lib/srs/review-sync';
  import TodayNext from '$lib/components/TodayNext.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  /** A card in today's queue. Practice entries are words missed earlier this session, already saved. */
  interface QueueEntry {
    word: ReviewWord;
    practice: boolean;
  }

  type SessionStats = SessionState['stats'];

  // A missed word comes back after this many other cards.
  const AGAIN_GAP = 3;

  let queue = $state<QueueEntry[]>([]);
  let index = $state(0);
  let revealed = $state(false);
  let stats = $state<SessionStats>({ reviewed: 0, again: 0, newLearned: 0 });
  let forecast = $state<number[]>([]);
  let moreAvailable = $state(false);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let requiresSubscription = $state(false);
  let totalReviewCount = $state(0);
  let totalSavedWordsCount = $state(0);
  let showSchedulingModal = $state(false);
  let card = $state<ReturnType<typeof ReviewCard> | null>(null);

  // Offline review: subscribers keep a copy of the deck on the device; every rating is queued and synced.
  let offline = $state(false);
  let pending = $state(0);
  let syncFailed = $state(false);
  let justSynced = $state(false);
  let deck: Deck | null = null;

  // Generation + import modal visibility
  let showGenerateSentences = $state(false);
  let showGenerateWords = $state(false);
  let showImport = $state(false);

  const userId = $derived(data.user?.id as string | undefined);
  const current = $derived(queue[index]);
  const sessionComplete = $derived(!isLoading && index >= queue.length);
  const previews = $derived(current ? previewIntervals(wordToCard(current.word)) : null);
  const remaining = $derived.by(() => {
    const rest = queue.slice(index);
    return {
      due: rest.filter((e) => !e.practice && e.word.state !== State.New).length,
      new: rest.filter((e) => !e.practice && e.word.state === State.New).length,
      again: rest.filter((e) => e.practice).length
    };
  });
  const recalledPct = $derived(stats.reviewed ? Math.round(((stats.reviewed - stats.again) / stats.reviewed) * 100) : 0);

  function finishSession() {
    persistDeck();
    if (stats.reviewed === 0) return;
    trackEvent('review_session_completed', { total_reviewed: stats.reviewed, again_count: stats.again, offline });
    if (offline && deck) {
      deck.pendingCycleBonus = true;
      persistDeck();
    } else {
      awardXp('review_cycle');
    }
    refreshSummary();
  }

  function awardXp(eventType: 'review_cycle') {
    fetch('/api/award-xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType })
    })
      .then((r) => r.json())
      .then((xpData) => {
        if (xpData.success) {
          userXp.set(xpData.newTotalXp);
          if (xpData.leveledUp) userLevel.set(xpData.newLevel);
          const title = LEVEL_TIERS.find((t) => t.level === xpData.newLevel)?.title;
          showXpToast(xpData.xpAwarded, xpData.leveledUp, xpData.newLevel, title);
        }
      })
      .catch(() => {});
  }

  const today = () => new Date().toDateString();

  // The session (stats and missed words still to practice) survives a reload for the rest of the day.
  function sessionState(): SessionState {
    return { day: today(), stats, practice: queue.slice(index).filter((e) => e.practice).map((e) => e.word) };
  }

  function persistDeck() {
    if (!deck) return;
    deck.session = sessionState();
    saveDeck(deck);
  }

  /** Sends queued ratings and folds the result into the page: XP, paywall, and the server's word state. */
  async function runSync() {
    if (!userId) return;
    const hadPending = pending;
    const outcome = await syncReviews(userId);
    pending = outcome.remaining;
    syncFailed = outcome.status === 'failed';
    if (outcome.status !== 'synced') return;

    const { response } = outcome;
    totalReviewCount = response.reviewCount || totalReviewCount;
    if (response.requiresSubscription) requiresSubscription = true;

    if (response.xp.awarded > 0 && response.xp.last) {
      const { newTotalXp, newLevel } = response.xp.last;
      userXp.set(newTotalXp);
      if (response.xp.leveledUp) {
        userLevel.set(newLevel);
        const title = LEVEL_TIERS.find((t) => t.level === newLevel)?.title;
        showXpToast(response.xp.awarded, true, newLevel, title);
      }
    }

    if (deck) {
      deck.words = deck.words.map((w) => (response.words[w.id] ? withPatch(w, response.words[w.id]) : w));
      if (deck.pendingCycleBonus) {
        deck.pendingCycleBonus = false;
        awardXp('review_cycle');
      }
      persistDeck();
    }

    // A quiet confirmation after reviews made offline (or several at once) go through.
    if (hadPending > 1 && pending === 0) {
      justSynced = true;
      setTimeout(() => (justSynced = false), 3000);
    }
  }

  async function fetchWords() {
    const response = await fetch('/api/review-words');
    const result = await response.json();
    if (!response.ok) {
      if (result.requiresSubscription) {
        requiresSubscription = true;
        totalReviewCount = result.reviewCount || 0;
        return null;
      }
      throw new Error(result.error || 'Failed to load words');
    }
    requiresSubscription = false;
    totalReviewCount = result.reviewCount || 0;
    totalSavedWordsCount = result.totalSavedWordsCount || 0;
    forecast = result.forecast ?? [];
    return result as {
      words: ReviewWord[];
      upcoming?: ReviewWord[];
      limit: number;
      forecast: number[];
      hasActiveSubscription: boolean;
      totalSavedWordsCount: number;
    };
  }

  function buildQueue(words: ReviewWord[], session: SessionState | null) {
    const saved = session?.day === today() ? session : null;
    const fresh = words.map((word) => ({ word, practice: false }));
    const practice = (saved?.practice ?? [])
      .filter((p) => !words.some((w) => w.id === p.id))
      .map((word) => ({ word, practice: true }));
    stats = saved?.stats ?? { reviewed: 0, again: 0, newLearned: 0 };
    queue = [...fresh, ...practice];
    index = 0;
    revealed = false;
  }

  async function loadWords() {
    if (!userId) return;
    isLoading = true;
    error = null;
    // Send anything queued first, so the server's list already reflects it.
    await runSync();
    const stored = await loadDeck(userId);

    try {
      const result = await fetchWords();
      if (!result) return;
      // Words with a rating still waiting to sync stay out of today's queue.
      const waiting = new Set((await pendingReviews(userId)).map((r) => r.savedWordId));
      const words = result.words.filter((w) => !waiting.has(w.id));

      if (result.hasActiveSubscription) {
        const byId = new Map([...result.words, ...(result.upcoming ?? [])].map((w) => [w.id, w]));
        deck = {
          userId,
          savedAt: Date.now(),
          words: [...byId.values()],
          limit: result.limit,
          forecast: result.forecast,
          totalSavedWordsCount: result.totalSavedWordsCount,
          session: stored?.session ?? null,
          pendingCycleBonus: stored?.pendingCycleBonus ?? false
        };
      } else {
        deck = null;
      }
      buildQueue(words, stored?.session ?? null);
      persistDeck();
    } catch (err) {
      // No connection (or the server is down): review from the copy on this device.
      if (stored) {
        deck = stored;
        offline = true;
        const now = Date.now();
        totalSavedWordsCount = stored.totalSavedWordsCount;
        forecast = forecastFromWords(stored.words, now);
        buildQueue(dueFromDeck(stored.words, stored.limit, now), stored.session);
      } else {
        error =
          typeof navigator !== 'undefined' && !navigator.onLine
            ? "You're offline. Open Review once with a connection to download your words for offline use."
            : err instanceof Error
              ? err.message
              : 'Failed to load words';
      }
    } finally {
      isLoading = false;
    }
  }

  /** After a session ends, refresh the forecast so it includes what was just reviewed. */
  async function refreshSummary() {
    if (offline) {
      const now = Date.now();
      forecast = deck ? forecastFromWords(deck.words, now) : forecast;
      moreAvailable = deck ? dueFromDeck(deck.words, deck.limit, now).length > 0 : false;
      return;
    }
    try {
      await runSync();
      const result = await fetchWords();
      moreAvailable = !!result && result.words.length > 0;
    } catch {
      moreAvailable = false;
    }
  }

  onMount(() => {
    offline = !navigator.onLine;
    pendingReviews(userId ?? '').then((r) => (pending = r.length));
    loadWords();

    const goOnline = () => {
      offline = false;
      runSync();
    };
    const goOffline = () => (offline = true);
    const onVisible = () => {
      if (document.visibilityState === 'visible') runSync();
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });

  function reveal() {
    revealed = true;
  }

  function rate(rating: Rating) {
    const entry = current;
    if (!entry || !userId) return;
    const { word, practice } = entry;

    trackEvent('review_word_answered', { word_id: word.id, rating, correct: rating > 1, practice, dialect: word.dialect, offline });

    if (!practice) {
      stats.reviewed++;
      if (rating === 1) stats.again++;
      else if (word.state === State.New) stats.newLearned++;

      // Scheduled here first (so it leaves today's list even offline), then queued and synced.
      const reviewedAt = Date.now();
      if (deck) {
        const updated = applyRating(word, rating, reviewedAt);
        deck.words = deck.words.map((w) => (w.id === word.id ? updated : w));
      }
      pending++;
      queueReview({ id: crypto.randomUUID(), userId, savedWordId: word.id, rating, reviewedAt }).then(runSync);
    }

    // A missed word comes back a few cards later. That repeat is practice only; FSRS already scheduled it.
    if (rating === 1) {
      queue.splice(Math.min(index + 1 + AGAIN_GAP, queue.length), 0, { word, practice: true });
    }

    index++;
    revealed = false;
    if (index >= queue.length) finishSession();
    else persistDeck();
  }

  async function startNewSession() {
    trackEvent('review_session_new_started', { previous_reviewed_count: stats.reviewed });
    if (deck) deck.session = null;
    queue = [];
    await loadWords();
  }

  function isTyping(target: EventTarget | null) {
    const el = target as HTMLElement | null;
    return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!current || requiresSubscription || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
    if (showGenerateWords || showGenerateSentences || showImport || showSchedulingModal) return;
    if (document.querySelector('dialog[open], [role="dialog"]')) return;

    if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      reveal();
    } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      rate(Number(e.key) as Rating);
    } else if (!offline && (e.key === 'r' || e.key === 'R')) {
      card?.playAudio();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet addActions()}
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-xl overflow-hidden border border-tile-500 bg-tile-500">
    <button type="button" class="add-action" onclick={() => { showGenerateWords = true; trackEvent('review_generate_words_opened'); }}>
      <span class="font-semibold text-text-300">Generate words</span>
      <span class="text-sm text-text-200">A list tailored to your level and topics</span>
    </button>
    <button type="button" class="add-action" onclick={() => { showGenerateSentences = true; trackEvent('review_generate_sentences_opened'); }}>
      <span class="font-semibold text-text-300">Generate sentences</span>
      <span class="text-sm text-text-200">Practice sentences around grammar or vocab</span>
    </button>
    <button type="button" class="add-action" onclick={() => { showImport = true; }}>
      <span class="font-semibold text-text-300">Import words</span>
      <span class="text-sm text-text-200">From our library or your own list</span>
    </button>
  </div>
{/snippet}

<div class="min-h-screen bg-tile-300">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
    <header class="mb-8 flex items-end justify-between gap-4">
      <div>
        <p class="srs-label mb-1">Spaced repetition</p>
        <h1 class="text-2xl sm:text-3xl text-text-300 font-semibold tracking-tight">Review</h1>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <a href={resolve('/review/all-words')} class="text-text-200 hover:text-text-300 underline-offset-4 hover:underline">My words</a>
        <button
          type="button"
          onclick={() => { showSchedulingModal = true; trackEvent('review_graduation_info_opened'); }}
          class="w-7 h-7 rounded-full border border-tile-600 text-text-200 hover:text-text-300 hover:bg-tile-400 transition-colors text-xs font-semibold"
          aria-label="How scheduling works"
        >?</button>
      </div>
    </header>

    {#if offline || pending > 0 || justSynced || syncFailed}
      <p class="sync-status" role="status" class:is-offline={offline}>
        {#if offline}
          <span class="dot" aria-hidden="true"></span>
          Offline{#if pending > 0} · {pending} review{pending === 1 ? '' : 's'} will sync when you're back online{:else} · your reviews are saved on this device{/if}
        {:else if syncFailed}
          {pending} review{pending === 1 ? '' : 's'} not saved yet · retrying
        {:else if pending > 0}
          Saving {pending} review{pending === 1 ? '' : 's'}…
        {:else}
          ✓ All reviews synced
        {/if}
      </p>
    {/if}

    {#if requiresSubscription}
      <section class="srs-paper rounded-2xl border border-tile-500 px-6 sm:px-10 py-12 text-center">
        <p class="text-5xl font-bold text-text-300 mb-4" dir="rtl">تابِع</p>
        <h2 class="text-xl font-semibold text-text-300 mb-2">You've used your free reviews</h2>
        <p class="text-text-200 max-w-md mx-auto mb-8">
          You've completed {totalReviewCount} review{totalReviewCount !== 1 ? 's' : ''}. Subscribe to keep your words on schedule with unlimited spaced repetition.
        </p>
        <div class="flex justify-center">
          <SubscribeButton />
        </div>
      </section>
    {:else if isLoading}
      <div class="flex flex-col items-center py-24">
        <AlphabetCycle />
        <p class="text-text-200 mt-4">Setting out your cards…</p>
      </div>
    {:else if error}
      <section class="rounded-2xl border border-tile-500 bg-tile-200 px-6 py-10 text-center">
        <p class="font-semibold text-text-300 mb-1">Couldn't load your words</p>
        <p class="text-sm text-text-200 mb-6">{error}</p>
        <button type="button" class="px-5 py-2.5 rounded-xl bg-tile-400 hover:bg-tile-500 border border-tile-600 text-text-300 font-semibold" onclick={loadWords}>
          Try again
        </button>
      </section>
    {:else if sessionComplete}
      <section class="space-y-8">
        {#if totalSavedWordsCount === 0}
          <div class="srs-paper rounded-2xl border border-tile-500 px-6 sm:px-10 py-12 text-center">
            <p class="text-6xl font-bold text-text-300 mb-4" dir="rtl">ابدأ</p>
            <h2 class="text-xl font-semibold text-text-300 mb-2">Your desk is empty</h2>
            <p class="text-text-200 max-w-md mx-auto">
              Save words while you read, or add a batch below. Each word comes back right before you'd forget it.
            </p>
          </div>
        {:else}
          <div class="srs-paper rounded-2xl border border-tile-500 px-6 sm:px-10 pt-12 pb-8">
            <div class="text-center">
              <p class="text-6xl font-bold text-text-300 mb-3" dir="rtl">أحسنت</p>
              <h2 class="text-xl font-semibold text-text-300">
                {stats.reviewed > 0 ? 'Desk cleared' : 'Nothing due right now'}
              </h2>
              <p class="text-sm text-text-200 mt-1">
                {stats.reviewed > 0 ? 'Every word due today is reviewed.' : 'Your words are resting. Come back when they’re due.'}
              </p>
            </div>

            {#if stats.reviewed > 0}
              <dl class="grid grid-cols-3 mt-8 border-y border-tile-500 divide-x divide-tile-500">
                <div class="py-4 text-center">
                  <dt class="srs-label">Reviewed</dt>
                  <dd class="text-2xl font-semibold text-text-300 tabular-nums mt-1">{stats.reviewed}</dd>
                </div>
                <div class="py-4 text-center">
                  <dt class="srs-label">Recalled</dt>
                  <dd class="text-2xl font-semibold text-text-300 tabular-nums mt-1">{recalledPct}%</dd>
                </div>
                <div class="py-4 text-center">
                  <dt class="srs-label">New learned</dt>
                  <dd class="text-2xl font-semibold text-text-300 tabular-nums mt-1">{stats.newLearned}</dd>
                </div>
              </dl>
            {/if}

            {#if forecast.length}
              <div class="mt-8">
                <p class="srs-label mb-3">Coming up this week</p>
                <DueForecast {forecast} />
              </div>
            {/if}

            {#if moreAvailable}
              <div class="mt-8 flex justify-center">
                <button
                  type="button"
                  onclick={startNewSession}
                  class="px-5 py-2.5 rounded-xl bg-tile-400 hover:bg-tile-500 border border-tile-600 text-text-300 font-semibold transition-colors"
                >
                  Keep going
                </button>
              </div>
            {/if}
          </div>
        {/if}

        {#if !offline && stats.reviewed > 0}
          <TodayNext justFinished="review" />
        {/if}

        {#if !offline}
          <div>
            <p class="srs-label mb-3">Add to your deck</p>
            {@render addActions()}
          </div>
        {/if}
      </section>
    {:else if current && previews}
      <div class="mb-3 flex items-center justify-between text-xs">
        <p class="srs-label !tracking-[0.1em]">
          <span class="tabular-nums">{remaining.due}</span> due
          <span class="mx-1.5 opacity-50">·</span>
          <span class="tabular-nums">{remaining.new}</span> new
          {#if remaining.again > 0}
            <span class="mx-1.5 opacity-50">·</span>
            <span class="tabular-nums text-[color:var(--srs-again)]">{remaining.again} again</span>
          {/if}
        </p>
        <p class="text-text-200 tabular-nums">{index + 1} / {queue.length}</p>
      </div>
      <div class="h-[2px] bg-tile-500 rounded-full mb-5 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={index}>
        <div class="h-full bg-[color:var(--srs-good)] transition-[width] duration-500 ease-out" style="width: {(index / queue.length) * 100}%"></div>
      </div>

      {#key index}
        <ReviewCard
          bind:this={card}
          word={current.word}
          {previews}
          isPractice={current.practice}
          {revealed}
          {offline}
          onReveal={reveal}
          onRate={rate}
        />
      {/key}

      <footer class="mt-10 flex items-center justify-center gap-5 text-sm text-text-200" class:hidden={offline}>
        <button type="button" class="hover:text-text-300" onclick={() => (showGenerateWords = true)}>Generate words</button>
        <span class="opacity-40">·</span>
        <button type="button" class="hover:text-text-300" onclick={() => (showGenerateSentences = true)}>Sentences</button>
        <span class="opacity-40">·</span>
        <button type="button" class="hover:text-text-300" onclick={() => (showImport = true)}>Import</button>
      </footer>
    {/if}

    <Modal isOpen={showSchedulingModal} handleCloseModal={() => (showSchedulingModal = false)} width="480px">
      <div class="p-6 pt-10 space-y-5 text-sm text-text-200">
        <div>
          <p class="srs-label mb-1">How scheduling works</p>
          <p>
            Each word has a <span class="font-semibold text-text-300">memory strength</span>: how many days it takes
            before your chance of remembering it drops to 90%. A word comes back right around then, the point
            where reviewing it does the most good.
          </p>
        </div>
        <ul class="rounded-xl border border-tile-500 divide-y divide-tile-500 overflow-hidden">
          {#each [
            { label: 'Again', color: 'var(--srs-again)', text: "You forgot. It comes back later this session, and again soon after." },
            { label: 'Hard', color: 'var(--srs-hard)', text: 'You got it, with effort. Strength grows a little.' },
            { label: 'Good', color: 'var(--srs-good)', text: 'You remembered. The usual choice.' },
            { label: 'Easy', color: 'var(--srs-easy)', text: 'Instant recall. The gap grows a lot.' }
          ] as r (r.label)}
            <li class="flex gap-3 px-4 py-3 bg-tile-200">
              <span class="w-1 self-stretch rounded-full" style="background: {r.color}"></span>
              <p><span class="font-semibold text-text-300">{r.label}</span> — {r.text}</p>
            </li>
          {/each}
        </ul>
        <p>
          Each button shows when you'll next see the word. The gaps adapt to you: words you find hard come back
          more often, easy ones drift out to weeks and months.
        </p>
        <p class="hidden [@media(hover:hover)]:block">
          Shortcuts: <kbd class="font-mono text-xs">Space</kbd> shows the answer, <kbd class="font-mono text-xs">1</kbd>–<kbd class="font-mono text-xs">4</kbd> rate, <kbd class="font-mono text-xs">R</kbd> plays the audio.
        </p>
      </div>
    </Modal>

    <GenerateWordsModal
      bind:open={showGenerateWords}
      user={data.user}
      onCompleted={loadWords}
      onStartReviewing={startNewSession}
    />

    <GenerateSentencesModal
      bind:open={showGenerateSentences}
      user={data.user}
      onCompleted={loadWords}
      onStartReviewing={startNewSession}
    />

    <ImportWordsModal bind:open={showImport} user={data.user} onImported={loadWords} />
  </div>
</div>

<style>
  .sync-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: -1rem 0 1.5rem;
    font-size: 0.8125rem;
    color: var(--text2);
  }
  .sync-status.is-offline {
    color: var(--text1);
  }
  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--srs-hard);
  }

  .add-action {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 1.25rem;
    text-align: left;
    background: var(--tile2);
    transition: background-color 150ms;
  }

  .add-action:hover {
    background: var(--tile3);
  }
</style>
