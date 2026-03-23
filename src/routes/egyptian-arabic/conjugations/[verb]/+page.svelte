<script lang="ts">
  import type { PageData } from './$types';
  import ConjugationExercise from '$lib/components/dialect-shared/conjugations/ConjugationExercise.svelte';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.verb.english} — Verb Conjugations | Egyptian Arabic</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-8">
  <!-- Back link -->
  <a
    href="/egyptian-arabic/conjugations"
    class="inline-flex items-center gap-1 text-sm text-text-200 hover:text-text-300 mb-6 transition-colors"
  >
    ← Back to all verbs
  </a>

  <ConjugationExercise verb={data.verb} />
</div>
