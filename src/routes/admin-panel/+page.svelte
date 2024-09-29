<script>
	export let data;
</script>
<table>
	<thead>
		<tr class="flex flex-row gap-2">
			<td>Email</td>
			<td>ID</td>
			<td>Is Subscriber</td>
			<td>Sentences Viewed</td>
			<td>Verb conjugation tenses viewed</td>
		</tr>
	</thead>
	<tbody class="border border-tile-300">
		{#each data.users as user}
			<tr class="flex flex-row gap-2">
				<td>{user.email}</td>
				<td>{user.id}</td>
				<td>{user.is_subscriber}</td>
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
	}
	td {
		border: 1px solid black;
		padding: 4px;
	}

	tr {
		padding: 8px;
		width: 100%;
	}
</style>
