<script lang="ts">
  import Button from '$lib/components/Button.svelte';
	import type { PageData } from './$types';
  import { mkConfig, generateCsv, download } from "export-to-csv";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const dataToExport = data.savedWords.map(word => ({
    arabic: word.arabic_word,
    english: word.english_word,
    transliterated: word.transliterated_word
  }));

  const csvConfig = mkConfig({ useKeysAsHeaders: true });

  let csv: any;

  if (data.savedWords.length === 0) {
    csv = "No data to export";
  } else {
    csv = generateCsv(csvConfig)(dataToExport);
  }

  function downloadCsv() {
    download(csvConfig)(csv);
  }
</script>

<section class="max-w-3xl mx-auto px-4 py-8">
  <a href="/profile" class="inline-flex items-center gap-1 text-sm font-medium text-brand underline mb-6">
    ← Back to profile
  </a>

  <header class="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
    <div>
      <h2 class="text-2xl text-text-300 font-bold">Saved Words</h2>
      <p class="text-text-200 mt-1">Export your saved words as a CSV and import them into an Anki deck.</p>
    </div>
    {#if data.savedWords.length > 0}
      <div class="w-fit shrink-0">
        <Button onClick={downloadCsv} type="button">Download CSV</Button>
      </div>
    {/if}
  </header>

  {#if data.savedWords.length === 0}
    <div class="bg-tile-400 border-2 border-tile-600 rounded-2xl p-10 text-center">
      <div class="text-4xl mb-3 opacity-50">🗂️</div>
      <p class="text-text-200">No saved words yet.</p>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-2xl border-2 border-tile-600">
      <table>
        <thead>
          <tr>
            <th>Arabic</th>
            <th>English</th>
            <th>Transliterated</th>
          </tr>
        </thead>
        <tbody>
          {#each data.savedWords as word (word.id ?? word.arabic_word + word.english_word)}
            <tr>
              <td class="arabic">{word.arabic_word}</td>
              <td>{word.english_word}</td>
              <td>{word.transliterated_word}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
	table {
		border-collapse: collapse;
		width: 100%;
	}
	td,
	th {
    border: 1px solid var(--tile6);
		text-align: left;
		padding: 0.625rem 0.75rem;
	}
  th {
    background-color: var(--tile5);
    color: var(--text1);
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: sticky;
    top: 0;
  }
  tr {
    background-color: var(--tile3);
    color: var(--text1);
  }
  tbody tr:nth-child(even) {
    background-color: var(--tile4);
  }
  td {
    font-size: 1rem;
  }
  td.arabic {
    font-size: 1.375rem;
  }
</style>
