<script lang="ts">
	import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import { PUBLIC_PRICE_ID } from '$env/static/public'
	import Checkmark from '$lib/components/Checkmark.svelte';
  let { data } = $props();

  const subscriberId = data.user?.subscriber_id;
</script>

<section class="min-h-screen bg-tile-300">
  <header class="border-b-2 border-tile-600 bg-tile-400 shadow-lg">
    <div class="max-w-6xl mx-auto px-4 sm:px-8 py-6">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <h1 class="text-xl sm:text-3xl text-text-300 font-bold">{data.user?.email}</h1>
          <a href="/profile/saved-words" class="text-lg text-text-300 underline hover:text-text-200 transition-colors duration-200">View Wordbank</a>
        </div>
        <div class="flex flex-row gap-3 justify-start sm:justify-end">
          <form 
            method="post" 
            action="?/logout" 
            use:enhance={() => {
              return async ({ result }) => {
                localStorage.clear();
                window.location.href = '/login';
              }
            }} 
            class="w-fit"
          >
            <Button type='submit'>
              Sign out
            </Button>
          </form>
          {#if data.hasActiveSubscription && subscriberId}
            <form method="post" action="/?/cancel">
              <input type="hidden" name="subscription_id" value={subscriberId} />
              <Button type="submit">
                Cancel Subscription
              </Button>
            </form>
          {/if}
        </div>
      </div>
    </div>
  </header>

  <div class="max-w-4xl mx-auto px-4 sm:px-8 py-8">
    <div class="border-2 border-tile-600 bg-tile-400 shadow-lg">
      <div class="p-6 sm:p-8">
        {#if data.hasActiveSubscription && subscriberId}
          <div class="text-center mb-6">
            <h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-3">You are subscribed</h1>
            <p class="text-lg sm:text-xl text-text-200 mb-2">
              Thank you for supporting Parallel Arabic!
            </p>
            <p class="text-lg text-text-200">
              Your subscription will renew on <span class="font-semibold text-text-300">{data.user?.subscription_end_date ? new Date(Number(data.user.subscription_end_date) * 1000).toLocaleString() : 'Unknown'}</span>
            </p>
          </div>

        {:else if data.hasActiveSubscription && !subscriberId}
          <div class="text-center mb-6">
            <h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-3">You have canceled your subscription</h1>
            <p class="text-lg sm:text-xl text-text-200 mb-4">
              You will have access to all features until <span class="font-semibold text-text-300">{data.user?.subscription_end_date ? new Date(Number(data.user.subscription_end_date) * 1000).toLocaleString() : 'Unknown'}</span>
            </p>
            <form method="POST" action="/?/subscribe" class="mt-6">
              <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
              <Button type="submit">
                Re-Subscribe
              </Button>
            </form>
          </div>

        {:else}
          <div class="text-center mb-8">
            <h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-3">You are currently not subscribed</h1>
            <p class="text-lg sm:text-xl text-text-200 mb-6">
              Subscribe for <span class="font-bold text-text-300">$10/month</span> to get access to all the features
            </p>
          </div>

          <div class="bg-tile-500 border-2 border-tile-600 p-6 mb-6">
            <h2 class="text-xl font-bold text-text-300 mb-4 text-center">What you'll get:</h2>
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-4 text-text-300">
              <li class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <Checkmark />
                </div>
                <span class="text-base leading-relaxed">Access to all stories and conversations</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <Checkmark />
                </div>
                <span class="text-base leading-relaxed">Unlimited AI practice sentences for beginner and intermediate levels</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <Checkmark />
                </div>
                <span class="text-base leading-relaxed">Access to all verbs for verb conjugation practice</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <Checkmark />
                </div>
                <span class="text-base leading-relaxed">Access to over 6,000 vocabulary words for writing and handwriting practice</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <Checkmark />
                </div>
                <span class="text-base leading-relaxed">Access to over 6,000 vocabulary words and multiple choice quizzes</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <Checkmark />
                </div>
                <span class="text-base leading-relaxed">Access to custom built Anki decks for Egyptian Arabic</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <Checkmark />
                </div>
                <span class="text-base leading-relaxed">Access to Alphabet learning</span>
              </li>
              <li class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <Checkmark />
                </div>
                <span class="text-base leading-relaxed">Save keywords and phrases to personal wordbank</span>
              </li>
            </ul>
          </div>

          <div class="text-center">
            <form method="POST" action="/?/subscribe">
              <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
              <Button type="submit">
                Subscribe Now
              </Button>
            </form>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>