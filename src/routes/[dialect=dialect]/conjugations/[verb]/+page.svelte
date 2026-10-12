<script lang="ts">
  import type { PageData } from './$types';
  import ConjugationExercise from '$lib/components/dialect-shared/conjugations/ConjugationExercise.svelte';
  import { formatDialectName } from '$lib/utils/seo';

  let { data }: { data: PageData } = $props();
</script>

<div class="max-w-2xl mx-auto px-4 py-8">
  <!-- Back link -->
  <a
    href="/{data.dialect}/conjugations"
    class="inline-flex items-center gap-1 text-sm text-text-200 hover:text-text-300 mb-6 transition-colors"
  >
    ← Back to all {formatDialectName(data.dialect)} verbs
  </a>

  <ConjugationExercise verb={data.verb} />

  {#if data.otherDialects.length}
    <section class="mt-10">
      <h2 class="mb-4 text-2xl font-bold text-text-300">
        "{data.verb.english}" in the other dialects
      </h2>
      <div class="grid gap-3 sm:grid-cols-3">
        {#each data.otherDialects as other (other.dialect)}
          <a
            href="/{other.dialect}/conjugations/{data.verb.slug}"
            class="block rounded-xl border border-tile-500 bg-tile-300 p-4 text-center transition-all hover:border-tile-600 hover:bg-tile-400"
          >
            <p class="mb-2 text-xs text-text-200">{formatDialectName(other.dialect)}</p>
            <p class="text-2xl font-bold text-text-300" dir="rtl">{other.arabic}</p>
            <p class="text-sm italic text-text-200">{other.transliteration}</p>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</div>
