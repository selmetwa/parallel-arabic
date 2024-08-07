<script lang="ts">
	import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
	import type { PageData } from './$types';
  import { mkConfig, generateCsv, download } from "export-to-csv";

	export let data: PageData;

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

<section class="px-4 py-8">
  <header class="flex flex-row gap-2 items-center justify-between mt-8 mb-4">
    <div>
      <h2 class="text-xl text-text-300 font-semibold">Saved Words</h2>
      <p class="text-text-200">Export saved words as a CSV and import into an Anki deck.</p>
    </div>
    <div class="w-fit">
    <Button onClick={downloadCsv} type="button">Download CSV</Button>
    </div>
  </header>

	<table>
		<thead>
			<tr>
				<th>Arabic</th>
				<th>English</th>
				<th>Transliterated</th>
			</tr>
		</thead>
		<tbody>
      {#if data.savedWords.length === 0}
        <p class="mt-2">No saved words</p>
      {/if}
			{#each data.savedWords as word}
				<tr>
					<td>{word.arabic_word}</td>
					<td>{word.english_word}</td>
					<td>{word.transliterated_word}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>


<style>
	table {
		font-family: arial, sans-serif;
		border-collapse: collapse;
		width: 100%;
	}
	td,
	th {
    border: 1px solid var(--tile6);
		text-align: left;
		padding: 8px;
	}
  tr {
    background-color: var(--tile3);
    color: var(--text2);
  }
  tr:nth-child(even) {
    background-color: var(--tile2);
  }
  td {
    font-size: 20px;
  }
</style>
