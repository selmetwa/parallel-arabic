<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { rememberNext, safeNext, withNewSignup } from '$lib/helpers/safe-next';
	import Button from '$lib/components/Button.svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import TestimonialWall from '$lib/components/TestimonialWall.svelte';
	import AuthValueProps from '$lib/components/AuthValueProps.svelte';
	import type { ActionData } from './$types';
	import { Browser } from '@capacitor/browser';
	import { App } from '@capacitor/app';

  // Get data and form from props
  let { data, form }: { data: any; form: ActionData } = $props();

  // Where to go after signing in, e.g. back to the game that asked for an account.
  const next = $derived(safeNext(page.url.searchParams.get('next')));
  const nextQuery = $derived(next === '/' ? '' : `?next=${encodeURIComponent(next)}`);

  // Form state
  let loading = $state(false);
  let turnstile: ReturnType<typeof Turnstile> | undefined = $state();
  let captchaVerified = $state(false);

  // Get the supabase client for Google OAuth (still needs to be client-side)
  let { supabase } = $derived(data);

  let appUrlListener: { remove: () => void } | null = null;

  async function handleGoogleSignup() {
    loading = true;

    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

    const redirectUrl = isNative
      ? 'com.parallelarabic.app://auth/callback'
      : `${window.location.origin}/auth/callback`;

    if (!isNative) rememberNext(next);

    const { data: oauthData, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: isNative
      }
    });

    if (authError || !oauthData?.url) {
      console.error('Google signup error:', authError?.message);
      loading = false;
      return;
    }

    if (isNative) {
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
            const sync = await fetch('/api/auth/sync', { method: 'POST' });
            const { needsOnboarding } = await sync.json().catch(() => ({}));
            goto(needsOnboarding ? withNewSignup(next) : next);
          }
        }
        loading = false;
      });
    }
    // On web, supabase handles redirect automatically via /auth/callback server route
  }

</script>

<section class="min-h-screen bg-tile-300 py-8 sm:py-12">
  <!-- Mobile: form, what's included, quotes. Desktop: form and what's included left, quotes right. -->
  <div class="max-w-6xl mx-auto px-4 sm:px-8 grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-10 lg:items-start">
      <form
        method="POST"
        action="?/signup"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
            turnstile?.reset();
          };
        }}
        class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-xl p-8 shrink-0"
      >
        <input type="hidden" name="next" value={next} />
        <h1 class="text-3xl font-bold text-text-300 mb-6">Create your account</h1>
        
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
          
          <div class="flex flex-col gap-2">
            <label for="password" class="text-base font-semibold text-text-200">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              disabled={loading}
              minlength="6"
              class="px-4 py-3 border-2 border-tile-600 bg-tile-200 text-text-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tile-500 focus:border-tile-500 transition-all"
            />
          </div>
        </div>

        <Turnstile bind:this={turnstile} bind:verified={captchaVerified} />

        <Button type="submit" disabled={loading || !captchaVerified} className="w-full !py-3 !text-lg mb-4">
          {loading ? 'Creating account...' : 'Sign Up'}
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

        <div class="mb-4">
          <button
            type="button"
            onclick={handleGoogleSignup}
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

        <div class="pt-4 border-t border-tile-500">
          <a href="/login{nextQuery}" class="text-text-200 hover:text-text-300 underline transition-colors">Already have an account? Login</a>
        </div>
      </form>
      <AuthValueProps cta="Create a free account" />
      <TestimonialWall class="lg:col-start-2 lg:row-start-1 lg:row-span-2" />
  </div>
</section>
