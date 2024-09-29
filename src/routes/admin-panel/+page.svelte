<script>
	export let data;
</script>
<table>
	<thead>
		<tr>
			<td>Email</td>
			<td>ID</td>
			<td>Is Subscriber</td>
      <td>Saved Words</td>
			<td>Sentences Viewed</td>
      <td>Verb conjugation tenses viewed</td>
		</tr>
	</thead>
	<tbody class="border border-tile-300">
		{#each data.users as user}
			<tr class="">
				<td>{user.email}</td>
				<td>{user.id}</td>
				<td>{user.is_subscriber}</td>
				<td>{user.savedWords.length ?? 0}</td>
        <td>{user.sentences_viewed}</td>
				<td>{user.verb_conjugation_tenses_viewed}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		border-collapse: collapse;
		width: 100%;
    background-color: var(--tile3);
    margin-top: 12px;
    color: var(text-300);
    font-weight: 500;
	}
	td {
    white-space: nowrap;
    padding: 8px;
		border: 1px solid black;
    width: 100%;
	}
  
  tr:nth-child(odd) {
    background-color: var(--tile4)
  }
	tr {
		width: 100%;
	}
</style>
