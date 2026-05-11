<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import type { ActionData } from './$types';
	import { Browser } from '@capacitor/browser';
	import { App } from '@capacitor/app';

  // Get data and form from props
  let { data, form }: { data: any; form: ActionData } = $props();

  // Form state
  let loading = $state(false);
  let resetMode = $state(false);

  // Get the supabase client for Google OAuth (still needs to be client-side)
  let { supabase } = $derived(data);

  let appUrlListener: { remove: () => void } | null = null;
  let appleLoading = $state(false);

  async function handleAppleLogin() {
    appleLoading = true;
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

    const redirectUrl = isNative
      ? 'com.parallelarabic.app://auth/callback'
      : `${window.location.origin}/auth/callback`;

    const { data: oauthData, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: isNative
      }
    });

    if (authError || !oauthData?.url) {
      console.error('Apple login error:', authError?.message);
      appleLoading = false;
      return;
    }

    if (isNative) {
      appUrlListener?.remove();
      await Browser.open({ url: oauthData.url });

      appUrlListener = await App.addListener('appUrlOpen', async ({ url }) => {
        if (!url.startsWith('com.parallelarabic.app://auth/callback')) return;

        appUrlListener?.remove();
        appUrlListener = null;

        try { await Browser.close(); } catch {}

        const code = new URL(url).searchParams.get('code');
        alert(`[DEBUG Apple] deep link received, code present: ${!!code}`);
        if (code) {
          const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          alert(`[DEBUG Apple] exchangeCodeForSession error: ${JSON.stringify(sessionError)} user: ${data?.user?.id?.slice(0,8)}`);
          if (!sessionError && data.session) {
            const syncRes = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
              })
            });
            alert(`[DEBUG Apple] sync response: ${syncRes.status}`);
            // Full reload to pick up server-side session cookies that sync just set
            window.location.href = '/';
          }
        }
        appleLoading = false;
      });
    }
    // On web, supabase handles redirect automatically via /auth/callback
  }

  async function handleGoogleLogin() {
    loading = true;

    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

    const redirectUrl = isNative
      ? 'com.parallelarabic.app://auth/callback'
      : `${window.location.origin}/auth/callback`;

    const { data: oauthData, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: isNative
      }
    });

    if (authError || !oauthData?.url) {
      console.error('Google login error:', authError?.message);
      loading = false;
      return;
    }

    if (isNative) {
      // Remove any previously registered listener before adding a new one
      appUrlListener?.remove();

      await Browser.open({ url: oauthData.url });

      appUrlListener = await App.addListener('appUrlOpen', async ({ url }) => {
        if (!url.startsWith('com.parallelarabic.app://auth/callback')) return;

        appUrlListener?.remove();
        appUrlListener = null;

        try {
          await Browser.close();
        } catch {
          // Browser may already be closed by the user
        }

        const code = new URL(url).searchParams.get('code');
        if (code) {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (!sessionError) {
            await fetch('/api/auth/sync', { method: 'POST' });
            goto('/');
          }
        }
        loading = false;
      });
    }
    // On web, supabase handles redirect automatically via /auth/callback server route
  }

  const features = [
    { icon: '🌍', title: 'Multiple Dialects', desc: 'Egyptian, Levantine, Moroccan & Fusha' },
      { icon: '📚', title: 'Lessons', desc: 'Customized lessons for all levels' },
      { icon: '🧠', title: 'Spaced Repetition', desc: 'Never forget a word again' },
    { icon: '📖', title: 'Stories & Audio', desc: 'Native audio pronunciation' },
    { icon: '💬', title: 'AI Tutor', desc: 'Real-time conversation practice' },
    { icon: '📺', title: 'Interactive Videos', desc: 'YouTube with transcripts' },
    { icon: '🤖', title: 'AI Practice', desc: 'Unlimited generated sentences' },
    { icon: '🎙️', title: 'Speaking', desc: 'Pronunciation feedback' },
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
        <div class="mb-4 flex flex-col gap-3">
          <button
            type="button"
            onclick={handleAppleLogin}
            disabled={appleLoading}
            class="w-full transition-all duration-300 flex items-center justify-center gap-3 bg-black text-white px-4 py-3 font-semibold border-2 border-black hover:bg-gray-900 disabled:opacity-50 rounded-lg shadow-md hover:shadow-lg"
          >
            <svg width="18" height="18" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" fill="white">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.5 753.1 1 621.9 1 495.7c0-210.1 137.1-321.4 272-321.4 70.4 0 129.1 46.3 173.6 46.3 42.8 0 109.6-49 188.6-49 30.4 0 108.2 2.6 168.9 80.5zm-234.2-184.7c-6.5 30.4-23.4 60.2-49.7 84.2-31.7 28.3-70.4 50.3-112.5 47.1-1.3-5.2-2-10.4-2-16.3 0-27.7 13-58.1 36.4-82.8 11.7-12.3 26.7-22.7 44.9-30.4 18.2-7.8 35.4-12.4 51.6-13.7.6 4 1.3 8.5 1.3 11.9z"/>
            </svg>
            {appleLoading ? 'Redirecting...' : 'Continue with Apple'}
          </button>
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
