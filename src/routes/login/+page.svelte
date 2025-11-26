<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import type { ActionData } from './$types';

  // Get data and form from props
  let { data, form }: { data: any; form: ActionData } = $props();

  // Form state
  let loading = $state(false);
  let resetMode = $state(false);

  // Get the supabase client for Google OAuth (still needs to be client-side)
  let { supabase } = $derived(data);

  async function handleGoogleLogin() {
    loading = true;

    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });

    if (authError) {
      console.error('Google login error:', authError.message);
      loading = false;
    }
  }

  const features = [
    { icon: '🌍', title: 'Multiple Dialects', desc: 'Egyptian, Levantine, Moroccan & Fusha' },
    { icon: '📚', title: 'Lessons', desc: 'Customized lessons for all levels' },
    { icon: '🧠', title: 'Spaced Repetition', desc: '20,000+ vocabulary words' },
    { icon: '📖', title: 'Stories & Audio', desc: 'Native audio pronunciation' },
    { icon: '💬', title: 'AI Tutor', desc: 'Real-time conversation practice' },
    { icon: '📺', title: 'Interactive Videos', desc: 'YouTube with transcripts' },
    { icon: '🤖', title: 'AI Practice', desc: 'Unlimited generated sentences' },
    { icon: '🎙️', title: 'Speaking', desc: 'Pronunciation feedback' },
    { icon: '📚', title: 'Vocabulary', desc: '20,000+ words with quizzes' },
    { icon: '✍️', title: 'Verb Mastery', desc: 'Conjugation practice' },
    { icon: '📦', title: 'Anki Decks', desc: 'Custom flashcard exports' },
    { icon: '🔤', title: 'Alphabet', desc: 'Handwriting & pronunciation' },
  ];

  // Split features for desktop layout
  const topFeatures = features.slice(0, 8); // Cards next to form (2x2 grid)
  const bottomFeatures = features.slice(8); // Cards below
</script>

<section class="min-h-screen bg-tile-300 py-8 sm:py-12">
  <div class="max-w-6xl mx-auto px-4 sm:px-8 flex gap-4 flex-col sm:flex-row">
    <div class="flex-1 flex flex-col gap-4">
      <form
      method="POST"
      action={resetMode ? "?/resetPassword" : "?/login"}
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          await update();
        };
      }}
      class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-xl p-8 shrink-0"
    >
      <h1 class="text-3xl font-bold text-text-300 mb-6">
        {resetMode ? 'Reset Password' : 'Login to your account'}
      </h1>
      
      <div class="flex flex-col gap-4 mb-4 min-w-[320px]">
        <div class="flex flex-col gap-2">
          <label for="email" class="text-base font-semibold text-text-200">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={loading}
            class="px-4 py-3 border-2 border-tile-600 bg-tile-200 text-text-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tile-500 focus:border-tile-500 transition-all"
          />
        </div>
        
        {#if !resetMode}
          <div class="flex flex-col gap-2">
            <label for="password" class="text-base font-semibold text-text-200">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={loading}
              class="px-4 py-3 border-2 border-tile-600 bg-tile-200 text-text-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tile-500 focus:border-tile-500 transition-all"
            />
          </div>
        {/if}
      </div>

      <Button type="submit" disabled={loading} className="w-full !py-3 !text-lg mb-4">
        {loading ? (resetMode ? 'Sending...' : 'Signing in...') : (resetMode ? 'Send Reset Link' : 'Log In')}
      </Button>

      {#if form?.error}
        <div class="mb-4 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg">
          <p class="font-semibold">Error</p>
          <p>{form.error}</p>
        </div>
      {/if}

      {#if form?.message}
        <div class="mb-4 p-4 bg-green-100 border-2 border-green-400 text-green-700 rounded-lg">
          {form.message}
        </div>
      {/if}

      {#if !resetMode}
        <div class="mb-4">
          <button
            type="button"
            onclick={handleGoogleLogin}
            disabled={loading}
            class="w-full transition-all duration-300 flex items-center justify-center gap-3 bg-tile-500 text-text-300 px-4 py-3 font-semibold border-2 border-tile-600 hover:bg-tile-600 disabled:opacity-50 rounded-lg shadow-md hover:shadow-lg"
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
      {/if}

      <div class="flex flex-row gap-4 justify-between pt-4 border-t border-tile-500">
        <a href="/signup" class="text-text-200 hover:text-text-300 underline transition-colors">Create an account</a>
        <button
          type="button"
          onclick={() => resetMode = !resetMode}
          disabled={loading}
          class="text-text-200 hover:text-text-300 underline bg-transparent border-none cursor-pointer transition-colors"
        >
          {resetMode ? 'Back to Login' : 'Forgot Password?'}
        </button>
      </div>
    </form>
    <div>
      <div class="grid grid-cols-2 gap-4 flex-1 content-start">
        {#each bottomFeatures as feature}
          <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-5 shadow-lg">
            <div class="text-2xl mb-2">{feature.icon}</div>
            <h3 class="text-base font-bold text-text-300 mb-1">{feature.title}</h3>
            <p class="text-text-200 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        {/each}
      </div>
    </div>
    </div>
    <div class="flex-1">
      <div class="grid grid-cols-2 gap-4 flex-1 content-start">
        {#each topFeatures as feature}
          <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-5 shadow-lg">
            <div class="text-2xl mb-2">{feature.icon}</div>
            <h3 class="text-base font-bold text-text-300 mb-1">{feature.title}</h3>
            <p class="text-text-200 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
<!-- <section class="min-h-screen bg-tile-300 py-8 sm:py-12">
  <div class="max-w-6xl mx-auto px-4 sm:px-8">
    
    <div class="lg:hidden">
      <form
        method="POST"
        action={resetMode ? "?/resetPassword" : "?/login"}
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
        class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-lg p-6 sm:p-8 mb-6"
      >
        <h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-5">
          {resetMode ? 'Reset Password' : 'Login to your account'}
        </h1>
        
        <div class="flex flex-col gap-4 mb-4">
          <div class="flex flex-col gap-2">
            <label for="email-mobile" class="text-base font-semibold text-text-200">Email</label>
            <input
              id="email-mobile"
              name="email"
              type="email"
              required
              disabled={loading}
              class="px-4 py-3 border-2 border-tile-600 bg-tile-200 text-text-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tile-500 focus:border-tile-500 transition-all"
            />
          </div>
          
          {#if !resetMode}
            <div class="flex flex-col gap-2">
              <label for="password-mobile" class="text-base font-semibold text-text-200">Password</label>
              <input
                id="password-mobile"
                name="password"
                type="password"
                required
                disabled={loading}
                class="px-4 py-3 border-2 border-tile-600 bg-tile-200 text-text-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tile-500 focus:border-tile-500 transition-all"
              />
            </div>
          {/if}
        </div>

        <Button type="submit" disabled={loading} className="w-full !py-3 !text-lg mb-4">
          {loading ? (resetMode ? 'Sending...' : 'Signing in...') : (resetMode ? 'Send Reset Link' : 'Log In')}
        </Button>

        {#if form?.error}
          <div class="mb-4 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg">
            <p class="font-semibold">Error</p>
            <p>{form.error}</p>
          </div>
        {/if}

        {#if form?.message}
          <div class="mb-4 p-4 bg-green-100 border-2 border-green-400 text-green-700 rounded-lg">
            {form.message}
          </div>
        {/if}

        {#if !resetMode}
          <div class="mb-4">
            <button
              type="button"
              onclick={handleGoogleLogin}
              disabled={loading}
              class="w-full transition-all duration-300 flex items-center justify-center gap-3 bg-tile-500 text-text-300 px-4 py-3 font-semibold border-2 border-tile-600 hover:bg-tile-600 disabled:opacity-50 rounded-lg shadow-md hover:shadow-lg"
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
        {/if}

        <div class="flex flex-row gap-4 justify-between pt-4 border-t border-tile-500">
          <a href="/signup" class="text-text-200 hover:text-text-300 underline transition-colors">Create an account</a>
          <button
            type="button"
            onclick={() => resetMode = !resetMode}
            disabled={loading}
            class="text-text-200 hover:text-text-300 underline bg-transparent border-none cursor-pointer transition-colors"
          >
            {resetMode ? 'Back to Login' : 'Forgot Password?'}
          </button>
        </div>
      </form>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {#each features as feature}
          <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-4 shadow-lg">
            <div class="text-xl mb-1">{feature.icon}</div>
            <h3 class="text-sm font-bold text-text-300 mb-1">{feature.title}</h3>
            <p class="text-text-200 text-xs leading-relaxed">{feature.desc}</p>
          </div>
        {/each}
      </div>
    </div>

    <div class="hidden lg:block space-y-5">
      <div class="flex gap-5 items-start flex-1">
        <form
          method="POST"
          action={resetMode ? "?/resetPassword" : "?/login"}
          use:enhance={() => {
            loading = true;
            return async ({ update }) => {
              loading = false;
              await update();
            };
          }}
          class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-xl p-8 w-fit shrink-0"
        >
          <h1 class="text-3xl font-bold text-text-300 mb-6">
            {resetMode ? 'Reset Password' : 'Login to your account'}
          </h1>
          
          <div class="flex flex-col gap-4 mb-4 min-w-[320px]">
            <div class="flex flex-col gap-2">
              <label for="email" class="text-base font-semibold text-text-200">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={loading}
                class="px-4 py-3 border-2 border-tile-600 bg-tile-200 text-text-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tile-500 focus:border-tile-500 transition-all"
              />
            </div>
            
            {#if !resetMode}
              <div class="flex flex-col gap-2">
                <label for="password" class="text-base font-semibold text-text-200">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={loading}
                  class="px-4 py-3 border-2 border-tile-600 bg-tile-200 text-text-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tile-500 focus:border-tile-500 transition-all"
                />
              </div>
            {/if}
          </div>

          <Button type="submit" disabled={loading} className="w-full !py-3 !text-lg mb-4">
            {loading ? (resetMode ? 'Sending...' : 'Signing in...') : (resetMode ? 'Send Reset Link' : 'Log In')}
          </Button>

          {#if form?.error}
            <div class="mb-4 p-4 bg-red-100 border-2 border-red-400 text-red-700 rounded-lg">
              <p class="font-semibold">Error</p>
              <p>{form.error}</p>
            </div>
          {/if}

          {#if form?.message}
            <div class="mb-4 p-4 bg-green-100 border-2 border-green-400 text-green-700 rounded-lg">
              {form.message}
            </div>
          {/if}

          {#if !resetMode}
            <div class="mb-4">
              <button
                type="button"
                onclick={handleGoogleLogin}
                disabled={loading}
                class="w-full transition-all duration-300 flex items-center justify-center gap-3 bg-tile-500 text-text-300 px-4 py-3 font-semibold border-2 border-tile-600 hover:bg-tile-600 disabled:opacity-50 rounded-lg shadow-md hover:shadow-lg"
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
          {/if}

          <div class="flex flex-row gap-4 justify-between pt-4 border-t border-tile-500">
            <a href="/signup" class="text-text-200 hover:text-text-300 underline transition-colors">Create an account</a>
            <button
              type="button"
              onclick={() => resetMode = !resetMode}
              disabled={loading}
              class="text-text-200 hover:text-text-300 underline bg-transparent border-none cursor-pointer transition-colors"
            >
              {resetMode ? 'Back to Login' : 'Forgot Password?'}
            </button>
          </div>
        </form>

        <div class="grid grid-cols-2 gap-4 flex-1 content-start">
          {#each topFeatures as feature}
            <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div class="text-2xl mb-2">{feature.icon}</div>
              <h3 class="text-base font-bold text-text-300 mb-1">{feature.title}</h3>
              <p class="text-text-200 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          {/each}
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        {#each bottomFeatures as feature}
          <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <div class="text-2xl mb-2">{feature.icon}</div>
            <h3 class="text-base font-bold text-text-300 mb-1">{feature.title}</h3>
            <p class="text-text-200 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section> -->
