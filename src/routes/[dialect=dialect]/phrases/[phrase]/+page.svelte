<script lang="ts">
  import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
  import { formatDialectName } from '$lib/utils/seo';
  import type { PhraseEntry } from '$lib/types/phrases';
  import type { Dialect } from '$lib/types/index';

  interface Props {
    data: {
      phrase: PhraseEntry;
      dialect: string;
      otherDialects: { dialect: string; arabic: string; transliteration: string }[];
    };
  }

  let { data }: Props = $props();

  const phrase = $derived(data.phrase);
  const dialectName = $derived(formatDialectName(data.dialect));
</script>

<article class="mx-auto max-w-3xl px-4 py-8">
  <nav class="mb-6 text-sm text-text-200">
    <a class="underline hover:text-text-300" href="/{data.dialect}">{dialectName}</a>
    <span class="mx-2">›</span>
    <a class="underline hover:text-text-300" href="/{data.dialect}/phrases">Phrases</a>
  </nav>

  <h1 class="mb-6 text-3xl font-bold text-text-300">
    How to say "{phrase.english}" in {dialectName}
  </h1>

  <!-- The phrase itself -->
  <section class="mb-8 rounded-xl border-2 border-tile-600 bg-tile-400 p-6 text-center sm:p-8">
    <p class="mb-4 text-5xl font-bold leading-snug text-text-300 sm:text-6xl" dir="rtl">
      {phrase.arabic}
    </p>
    <div class="mb-3 flex items-center justify-center gap-3">
      <p class="text-xl italic text-text-200">{phrase.transliteration}</p>
      <InlineAudioButton text={phrase.arabicPlain} dialect={data.dialect as Dialect} />
    </div>
    <dl class="mt-5 grid gap-3 border-t border-tile-600 pt-5 text-left sm:grid-cols-2">
      <div>
 <dt class="text-xs text-text-200">Without tashkeel</dt>
        <dd class="text-lg text-text-300" dir="rtl">{phrase.arabicPlain}</dd>
      </div>
      <div>
 <dt class="text-xs text-text-200">Franco / chat alphabet</dt>
        <dd class="text-lg text-text-300">{phrase.franco}</dd>
      </div>
      <div class="sm:col-span-2">
 <dt class="text-xs text-text-200">Literally</dt>
        <dd class="text-lg text-text-300">{phrase.literal}</dd>
      </div>
    </dl>
  </section>

  <!-- When to use it -->
  <section class="mb-8">
    <h2 class="mb-3 text-2xl font-bold text-text-300">When to use it</h2>
    <p class="text-lg leading-relaxed text-text-200">{phrase.usage}</p>
  </section>

  {#if phrase.variants.length}
    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-bold text-text-300">Other ways to say it</h2>
      <div class="space-y-3">
        {#each phrase.variants as variant (variant.arabic + variant.label)}
          <div class="rounded-xl border border-tile-500 bg-tile-300 p-5">
 <p class="mb-2 text-xs font-semibold text-text-200">
              {variant.label}
            </p>
            <div class="mb-2 flex flex-wrap items-center gap-3">
              <p class="text-2xl font-bold text-text-300" dir="rtl">{variant.arabic}</p>
              <InlineAudioButton text={variant.arabic} dialect={data.dialect as Dialect} />
            </div>
            <p class="text-text-200 italic">{variant.transliteration}</p>
            <p class="font-semibold text-text-300">{variant.english}</p>
            <p class="mt-2 text-sm text-text-200">{variant.note}</p>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if phrase.responses.length}
    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-bold text-text-300">How people reply</h2>
      <div class="space-y-3">
        {#each phrase.responses as reply (reply.arabic)}
          <div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
            <div class="flex flex-wrap items-center gap-3">
              <p class="text-xl font-bold text-text-300" dir="rtl">{reply.arabic}</p>
              <InlineAudioButton text={reply.arabic} dialect={data.dialect as Dialect} />
            </div>
            <p class="text-sm italic text-text-200">{reply.transliteration}</p>
            <p class="text-text-300">{reply.english}</p>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if phrase.examples.length}
    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-bold text-text-300">In a sentence</h2>
      <div class="space-y-3">
        {#each phrase.examples as example (example.arabic)}
          <div class="rounded-lg border border-tile-500 bg-tile-300 p-4">
            <div class="flex flex-wrap items-center gap-3">
              <p class="text-xl text-text-300" dir="rtl">{example.arabic}</p>
              <InlineAudioButton text={example.arabic} dialect={data.dialect as Dialect} />
            </div>
            <p class="text-sm italic text-text-200">{example.transliteration}</p>
            <p class="text-text-300">{example.english}</p>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if data.otherDialects.length}
    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-bold text-text-300">
        "{phrase.english}" in the other dialects
      </h2>
      <div class="grid gap-3 sm:grid-cols-3">
        {#each data.otherDialects as other (other.dialect)}
          <a
            href="/{other.dialect}/phrases/{phrase.slug}"
            class="block rounded-xl border border-tile-500 bg-tile-300 p-4 text-center transition-all hover:border-tile-600 hover:bg-tile-400"
          >
 <p class="mb-2 text-xs text-text-200">
              {formatDialectName(other.dialect)}
            </p>
            <p class="text-2xl font-bold text-text-300" dir="rtl">{other.arabic}</p>
            <p class="text-sm italic text-text-200">{other.transliteration}</p>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <aside class="rounded-xl border border-tile-500 bg-tile-300 p-6">
    <h2 class="mb-2 text-xl font-bold text-text-300">Practise saying it</h2>
    <p class="mb-4 text-text-200">
      Use it in a real conversation with the {dialectName} tutor, or browse the rest of the
      phrasebook.
    </p>
    <div class="flex flex-wrap gap-3">
      <a
        href="/tutor"
        class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Practise with the tutor
      </a>
      <a
        href="/{data.dialect}/phrases"
        class="rounded-lg border border-tile-600 bg-tile-500 px-5 py-2.5 font-semibold text-text-300 transition-colors hover:bg-tile-600"
      >
        All {dialectName} phrases
      </a>
    </div>
  </aside>
</article>
