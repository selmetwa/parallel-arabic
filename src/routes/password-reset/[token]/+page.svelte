<!-- routes/password-reset/[token]/+page.svelte -->
<script lang="ts">
	import { enhance } from "$app/forms";
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
	import { goto } from "$app/navigation";

  let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);
  let loading = $state(false);
</script>

<section class="flex flex-col gap-4 px-4 pt-4 sm:mt-12 sm:flex-row sm:px-20">
	<div class="flex-2">
		<form
			class="flex flex-1 flex-col gap-2 border border-tile-500 bg-tile-300 p-2"
			method="post"
			use:enhance={({ form }) => {
        loading = true;
				return async ({ result }) => {
					if (result.type === 'redirect') {
						message = { type: 'success', text: 'Password was reset successfully' };
            setTimeout(() => {
							window.location.href = '/';
						}, 1500);
					} else {
						message = { type: 'error', text: 'An error occurred' };
					}
          loading = false;
				};
			}}
		>
			<h1 class="text-xl font-semibold text-text-300">Create new password</h1>
			{#if message}
				<div class={`p-2 rounded ${message.type === 'success' ? 'bg-tile-400 text-text-300' : 'bg-tile-400 text-text-300'}`}>
					{message.text}
				</div>
			{/if}
			<!-- <Input type="email" name="email" label="Email"></Input> -->
       <Input type="email" name="email" label="Email"></Input>
       <Input type="password" name="password" label="New Password"></Input>
			<Button type="submit" className="mt-1" disabled={loading}>
        <div class="flex flex-row items-center gap-2">
        {#if loading}
        <div role="status">
          <svg
            aria-hidden="true"
            class="h-4 w-4 border border-tile-500 animate-spin fill-tile-500 text-text-200 dark:text-text-200"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span class="sr-only">Loading...</span>
        </div>
        {/if}
          {loading ? 'Creating new password' : 'Create new password'}
        </div>
      </Button>
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
					Practice writing over <b>16,000</b> Arabic words with a virtual arabic keyboard custom built
					for english speakers.
				</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Vocabulary</h2>
				<p class="text-md text-text-200">
					Practice over <b>16,000</b> words with fun multiple choice quizzes
				</p>
			</li>
			<li>
				<h2 class="text-xl font-semibold text-text-200">Alphabet</h2>
				<p class="text-md text-text-200">Master the Arabic script</p>
			</li>
		</ul>
	</div>
</section>