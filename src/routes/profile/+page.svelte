<script lang="ts">
	import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import { PUBLIC_TEST_PRICE_ID } from '$env/static/public'
	import Checkmark from '$lib/components/Checkmark.svelte';

  export let data;

  const subscriberId = data.user?.subscriber_id;
  const isSubscriber = data.user?.is_subscriber;
</script>

<section class="">
  <header class="flex bg-tile-400 flex-row py-6 px-12 gap-2 items-center justify-between">
    <div class="flex flex-row gap-2 items-center">
      <h1 class="text-2xl text-text-300 font-semibold">{data.user?.email}</h1>
      <a href="/profile/saved-words" class="text-lg text-text-300 underline">View Wordbank</a>
    </div>
    <div class="flex flex-row gap-2">
      <form method="post" action="?/logout" use:enhance class="w-fit">
        <Button type='submit'>
          Sign out
        </Button>
      </form>
      {#if isSubscriber}
        <form method="post" action="/?/cancel">
          <input type="hidden" name="subscription_id" value={subscriberId} />
          <Button type="submit">
            Cancel Subscription
          </Button>
        </form>
      {/if}
    </div>
  </header>
  <div class="mx-auto mb-6 mt-12 border w-fit p-6 border-tile-600 bg-tile-400 text-center">
    {#if isSubscriber}
      <h1 class="text-2xl font-bold text-text-300">You are subscribed</h1>
      <p class="mt-2 text-lg text-text-300">
        Thank you for supporting Parallel Arabic!
      </p>
      <p class="mt-2 text-lg text-text-300">
        Your subscription will renew on {new Date(data.user?.subscription_end_date * 1000).toLocaleString()}
      </p>
    {:else}
      <h1 class="text-2xl font-bold text-text-300">You are currently not subscribed</h1>
      <p class="mt-2 text-lg text-text-300">
        Subscribe for $10/month to get access to all the features
      </p>
			<ul class="mt-3 flex flex-col gap-4 px-4 text-text-300">
				<li class="flex items-start items-center gap-2">
					<Checkmark />
					<span>Access to all stories and conversations</span>
				</li>
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Unlimited AI practice sentences for beginner and intermediate levels</span>
				</li>
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to 4,100 vocabulary words for writing and handwriting practice</span>
				</li>
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to 4,100 vocabulary words and multiple choice quizzes</span>
				</li>
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to custom built Anki decks for Egyptian Arabic</span>
				</li>
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to Alphabet learning</span>
				</li>
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Save keywords and phrases to personal wordbank</span>
				</li>
			</ul>
      <form method="POST" action="/?/subscribe" class="px-4 mt-4">
        <!-- Modify this value using your own Stripe price_id -->
        <input type="hidden" name="price_id" value={PUBLIC_TEST_PRICE_ID} />
          <Button type="submit">
            Subscribe
          </Button>
      </form>
    {/if}
</section>