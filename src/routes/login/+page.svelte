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
    class="flex-1 border border-tile-500 flex flex-col gap-2 p-2 bg-tile-300"
  >
    <h1 class="text-xl font-semibold text-text-300">Login to your account</h1>
    <Input  type="email" name="email" label="Email"></Input>
    <Input type="password" name="password" label="Password"></Input>
    <Button type="submit" className="mt-1">Log In</Button>
    {#if form?.message}
      <p class="error">{form.message}</p>
    {/if}
    <footer class="flex flex-row gap-2 justify-between">
      <a href="/signup" class="text-text-200 underline">Create an account</a>
      <a href="/password-reset" class="text-text-200 underline">Forgot Password?</a>
    </footer>
  </form>
  </div>

<div class="flex-3 border border-tile-600 bg-tile-400">
  <ul class="p-8 flex flex-col gap-3">
    <li>
      <h2 class="text-xl font-semibold text-text-200">Reading</h2>
      <p class="text-text-200 text-md">Read short stories in egyptian arabic alongside the english translation and transliteration of the text.</p>
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
      <p class="text-text-200 text-md">Practice writing over <b>6,000</b> Arabic words with a virtual arabic keyboard custom built for english speakers.</p>
    </li>
    <li>
      <h2 class="text-xl font-semibold text-text-200">Vocabulary</h2>
      <p class="text-text-200 text-md">Practice over <b>6,000</b> words with fun multiple choice quizzes</p>
    </li>
    <li>
      <h2 class="text-xl font-semibold text-text-200">Alphabet</h2>
      <p class="text-text-200 text-md">Master the Arabic script</p>
    </li>
  </ul>
</div>
</section>
