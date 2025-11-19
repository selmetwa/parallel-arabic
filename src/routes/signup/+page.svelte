<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import type { ActionData } from './$types';

  // Get data and form from props
  let { data, form }: { data: any; form: ActionData } = $props();

  // Form state
  let loading = $state(false);

  // Get the supabase client for Google OAuth (still needs to be client-side)
  let { supabase } = $derived(data);

  async function handleGoogleSignup() {
    loading = true;

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (authError) {
      console.error('Google signup error:', authError.message);
      loading = false;
    }
  }

</script>

<section class="flex flex-col sm:flex-row gap-4 px-4 sm:px-20 pt-4 sm:mt-12">
  <div class="flex-2">
    <!-- Server-side Auth Form -->
    <form
      method="POST"
      action="?/signup"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          await update();
        };
      }}
      class="flex flex-col gap-2 border border-tile-500 bg-tile-300 p-2"
    >
      <h1 class="text-xl font-semibold text-text-300">Create your account</h1>
      
      <div class="flex flex-col gap-1">
        <label for="email" class="text-sm font-medium text-text-200">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={loading}
          class="px-3 py-2 border border-tile-600 bg-tile-200 text-text-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="flex flex-col gap-1">
        <label for="password" class="text-sm font-medium text-text-200">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          disabled={loading}
          minlength="6"
          class="px-3 py-2 border border-tile-600 bg-tile-200 text-text-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Button type="submit" disabled={loading} className="mt-1">
        {loading ? 'Creating account...' : 'Sign Up'}
      </Button>

      {#if form?.error}
        <p class="error">{form.error}</p>
      {/if}

      {#if form?.message}
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {form.message}
        </div>
      {/if}

      <div class="mt-1">
        <button
          type="button"
          onclick={handleGoogleSignup}
          disabled={loading}
          class="w-full transition-all duration-300 flex items-center justify-center gap-2 bg-tile-500 text-text-300 px-4 py-1 font-semibold border border-tile-600 hover:bg-tile-600 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>
      </div>

      <a href="/login" class="text-text-200 underline">Already have an account? Login</a>
    </form>
  </div>

  <div class="flex-3 border border-tile-600 bg-tile-400">
    <ul class="p-8 flex flex-col gap-3">
      <li>
        <h2 class="text-xl font-semibold text-text-200">Multiple Arabic Dialects</h2>
        <p class="text-text-200 text-md">Learn <strong>Egyptian, Levantine, Moroccan & Fusha</strong> with comprehensive practice material for each dialect.</p>
      </li>
      <li>
        <h2 class="text-xl font-semibold text-text-200">AI Tutor</h2>
        <p class="text-md text-text-200">
          Practice speaking Arabic with an AI tutor. Choose your dialect and have a conversation with real-time feedback.
        </p>
      </li>
      <li>
        <h2 class="text-xl font-semibold text-text-200">Spaced Repetition</h2>
        <p class="text-md text-text-200">
          Practice with spaced repetition to remember words and sentences. Generate your own content or import from <strong>over 16,000 vocab words</strong>.
        </p>
      </li>
      <li>
        <h2 class="text-xl font-semibold text-text-200">Interactive Videos</h2>
        <p class="text-text-200 text-md">Watch and learn from YouTube videos with transcripts, translations, and transliterations from all dialects.</p>
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
        <p class="text-text-200 text-md">Access to <strong>over 16,000 vocabulary words</strong> with multiple choice quizzes and writing practice.</p>
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

<style>
  .error {
    color: var(--color-error, #ef4444);
    background-color: var(--color-error-bg, #fee2e2);
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
</style>