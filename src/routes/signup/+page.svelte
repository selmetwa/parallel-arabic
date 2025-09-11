<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();
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
      <div class="mt-1">
        <a 
          href="/api/auth/google" 
          class="w-full transition-all duration-300 flex items-center justify-center gap-2 bg-tile-500 text-text-300 px-4 py-1 font-semibold border border-tile-600 hover:bg-tile-600"
        >
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
          Continue with Google
        </a>
      </div>
			<a href="/login" class="text-text-200 underline">Already have an account? Login</a>
		</form>
	</div>

	<div class="flex-3 border border-tile-600 bg-tile-400">
		<ul class="flex flex-col gap-3 p-8">
			<li>
				<h2 class="text-xl font-semibold text-text-200">Multiple Arabic Dialects</h2>
				<p class="text-text-200 text-md">Learn <strong>Egyptian, Levantine, Moroccan & Fusha</strong> with comprehensive practice material for each dialect.</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Stories & Audio</h2>
				<p class="text-md text-text-200">
					Access to all stories and conversations with native audio pronunciation.
				</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">AI-Generated Practice</h2>
				<p class="text-md text-text-200">
					<strong>Unlimited AI-generated practice sentences</strong> for all skill levels across all dialects.
				</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Speaking Practice</h2>
				<p class="text-text-200 text-md"><strong>Advanced speaking practice</strong> with real-time pronunciation feedback.</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Comprehensive Vocabulary</h2>
				<p class="text-text-200 text-md">Access to <strong>over 15,000 vocabulary words</strong> with multiple choice quizzes and writing practice.</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Verb Mastery</h2>
				<p class="text-text-200 text-md">Access to all verbs for comprehensive verb conjugation practice across all dialects.</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Custom Anki Decks</h2>
				<p class="text-text-200 text-md">Access to custom built Anki decks for all dialects for efficient spaced repetition learning.</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Arabic Alphabet</h2>
				<p class="text-text-200 text-md">Complete Arabic Alphabet mastery with native pronunciation and handwriting practice.</p>
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
