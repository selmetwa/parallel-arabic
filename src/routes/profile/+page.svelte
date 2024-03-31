<script lang="ts">
	import { enhance } from '$app/forms';
  import Button from '../../components/Button.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<section class="mt-8 px-4">
  <form method="post" action="?/logout" use:enhance class="w-fit ml-auto">
    <Button type='submit'>
      Sign out
    </Button>
  </form>
	<h2 class="text-xl text-text-300 font-semibold pb-4">Saved Words</h2>

	<table class="border">
		<thead>
			<tr>
				<th>Arabic</th>
				<th>English</th>
				<th>Transliterated</th>
			</tr>
		</thead>
		<tbody>
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
