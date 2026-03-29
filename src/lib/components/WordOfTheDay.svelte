<script lang="ts">
  import AudioButton from '$lib/components/AudioButton.svelte';
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';

  interface Word {
    id: string;
    arabic: string;
    transliteration: string;
    english: string;
    example_egyptian: string | null;
    example_levantine: string | null;
    example_darija: string | null;
    example_fusha: string | null;
    audio_url: string | null;
  }

  interface Props {
    word: Word;
    initialSaved?: boolean;
    isLoggedIn?: boolean;
    userDialect?: string | null;
  }

  let { word, initialSaved = false, isLoggedIn = false, userDialect = null }: Props = $props();

  let isSaved = $state(untrack(() => initialSaved));
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  const dialects: { key: keyof Word; label: string }[] = [
    { key: 'example_egyptian', label: 'Egyptian' },
    { key: 'example_levantine', label: 'Levantine' },
    { key: 'example_darija', label: 'Moroccan' },
    { key: 'example_fusha', label: 'Fusha' },
  ];

  const examples = $derived(
    dialects
      .map(({ key, label }) => ({ label, text: word[key] as string | null }))
      .filter(({ text }) => !!text)
  );

  async function saveWord() {
    if (isSaved || isLoading) return;

    isLoading = true;
    error = null;

    try {
      const res = await fetch('/api/save-word-of-the-day', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          arabic: word.arabic,
          english: word.english,
          transliteration: word.transliteration,
          dialect: userDialect ?? 'egyptian-arabic',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        isSaved = true;
      } else {
        error = data.message || 'Something went wrong';
        setTimeout(() => (error = null), 3000);
      }
    } catch {
      error = 'Network error. Please try again.';
      setTimeout(() => (error = null), 3000);
    } finally {
      isLoading = false;
    }
  }
</script>

<article class="bg-tile-300 border border-tile-500 rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
  <!-- Header -->
  <p class="text-xs font-medium text-text-200 uppercase tracking-widest">Word of the Day ✨</p>

  <!-- Arabic word + audio -->
  <div class="flex items-start justify-between gap-3">
    <div class="flex flex-col gap-1">
      <p
        dir="rtl"
        class="text-4xl font-bold text-text-300 leading-tight"
        lang="ar"
      >{word.arabic}</p>
      <p class="text-sm text-text-200 italic">{word.transliteration}</p>
      <p class="text-base font-semibold text-text-300">{word.english}</p>
    </div>
    <div class="shrink-0 mt-1">
      <AudioButton text={word.arabic} audioUrl={word.audio_url ?? undefined} />
    </div>
  </div>

  <!-- Example sentences -->
  {#if examples.length > 0}
    <div class="flex flex-col gap-2 border-t border-tile-500 pt-3">
      <p class="text-xs font-medium text-text-200 uppercase tracking-widest">Examples</p>
      <ul class="flex flex-col gap-2">
        {#each examples as { label, text } (label)}
          <li class="flex flex-col gap-0.5">
            <span class="inline-flex">
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-tile-500 text-text-200">
                {label}
              </span>
            </span>
            <p dir="rtl" lang="ar" class="text-sm text-text-300 leading-relaxed pr-1">{text}</p>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Save button -->
  <div class="pt-1">
    {#if !isLoggedIn}
      <button
        type="button"
        onclick={() => goto('/login')}
        class="inline-flex items-center gap-2 py-2 px-4 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Save to Review
      </button>
    {:else if isSaved}
      <button
        type="button"
        disabled
        class="inline-flex items-center gap-2 py-2 px-4 rounded-xl font-semibold text-sm bg-tile-500 text-text-200 cursor-default opacity-80"
      >
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Saved +3 XP
      </button>
    {:else}
      <button
        type="button"
        onclick={saveWord}
        disabled={isLoading}
        class="inline-flex items-center gap-2 py-2 px-4 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if isLoading}
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Save to Review
        {/if}
      </button>
    {/if}

    {#if error}
      <p class="mt-2 text-xs text-red-400">{error}</p>
    {/if}
  </div>
</article>
