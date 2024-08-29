<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<section class="flex flex-col sm:flex-row gap-4 px-4 sm:px-20 pt-4 sm:mt-12">
	<div class="flex-2">
		<form
			method="post"
			use:enhance
			class="flex flex-col gap-2 border border-tile-500 bg-tile-300 p-2"
		>
			<h1 class="text-xl font-semibold text-text-300">Sign up</h1>
			<Input type="email" name="email"></Input>
			<Input type="password" name="password"></Input>
			<Button type="submit" className="mt-1">Sign Up</Button>
			{#if form?.message}
				<p class="error">{form.message}</p>
			{/if}
			<a href="/login" class="text-text-200 underline">Already have an account? Login</a>
		</form>
	</div>

	<div class="flex-3 border border-tile-600 bg-tile-400">
		<ul class="flex flex-col gap-3 p-8">
			<li>
				<h2 class="text-xl font-semibold text-text-200">Reading</h2>
				<p class="text-md text-text-200">
					Read short stories in egyptian arabic alongside the english translation and
					transliteration of the text.
				</p>
			</li>
      <li>
				<h2 class="text-xl font-semibold text-text-200">Sentence Practice</h2>
				<p class="text-md text-text-200">
					Practice reading comprehension and writing skills with AI generated short sentences.
				</p>
			</li>
      <li>
				<h2 class="text-xl font-semibold text-text-200">Verb Conjugation</h2>
				<p class="text-md text-text-200">
					Practice your verb conjugations in egyptian arabic with realtime spellchecking.
				</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Writing</h2>
				<p class="text-md text-text-200">
					Practice writing over <b>4,000</b> Arabic words with a virtual arabic keyboard custom built
					for english speakers.
				</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Vocabulary</h2>
				<p class="text-md text-text-200">
					Practice over <b>4,000</b> words with fun multiple choice quizzes
				</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Alphabet</h2>
				<p class="text-md text-text-200">Master the Arabic script</p>
			</li>
		</ul>
	</div>
</section>

<!-- <form method="post" use:enhance class="border-b border-r border-tile-500 flex flex-col gap-2 p-2 bg-tile-300 max-w-[350px]">
  <h1 class="text-xl font-semibold text-text-300">Sign up</h1>
  <Input type="email" name="email"></Input>
  <Input type="password" name="password"></Input>
  <Button type="submit">
    Sign Up
  </Button>
  {#if form?.message}
    <p class="error">{form.message}</p>
  {/if}
  <a href="/login" class="text-text-200 underline">Already have an account? Login</a>
</form> -->
