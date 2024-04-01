<!-- <script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '../../components/Button.svelte';
	import Input from '../../components/Input.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<form
	method="post"
	use:enhance
	class="border-b border-r border-tile-500 flex flex-col gap-2 p-2 bg-tile-300 max-w-[350px]"
>
	<h1 class="text-xl font-semibold text-text-300">Login to your account</h1>
	<Input placeholder="test@gmail.com" type="email" name="email"></Input>
	<Input placeholder="******" type="password" name="password"></Input>
	<Button type="submit">Log In</Button>
	{#if form?.message}
		<p class="error">{form.message}</p>
	{/if}
	<a href="/signup" class="text-text-200 underline">Create an account</a>
</form> -->
