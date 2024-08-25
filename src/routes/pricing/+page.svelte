<script>
	import Checkmark from '$lib/components/Checkmark.svelte';
  import Button from '$lib/components/Button.svelte';
  import { PUBLIC_TEST_PRICE_ID } from '$env/static/public'
</script>

<section class="mt-4 flex flex-col gap-6 px-6 py-8 sm:px-8">
	<h1 class="mx-auto text-5xl font-bold text-text-300">Pricing</h1>
  <p class="text-xl text-text-200 mx-auto">
    Take your Egyptian Arabic to the next level for the price of two cups of coffee a month.
  </p>
	<div class="mx-4 flex flex-col gap-3 sm:flex-row lg:mx-12">
		<div class="flex-1 border-2 border-tile-500">
			<div class="border-b border-tile-600 bg-tile-300 pb-2 pt-3 text-center">
				<h2 class="px-4 text-2xl font-bold">Free Tier</h2>
				<h3 class="px-4 text-xl font-medium">$0/month</h3>
			</div>
			<ul class="mt-3 flex flex-col gap-4 px-4 text-text-300">
				<li class="flex items-start items-center gap-2">
					<Checkmark />
					<span>Access to one conversation with native audio</span>
				</li>
        <li class="flex items-start gap-2">
					<Checkmark />
					<span>20 AI practice sentences for beginner and intermediate levels <span class="text-text-200 text-md">*requires account</span></span>
				</li>
        <li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to one verb for verb conjugation practice</span>
				</li>
        <li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to 156 vocabulary words for writing and handwriting practice</span>
				</li>
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to 156 vocabulary words and multiple choice quizzes</span>
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
		</div>
		<div class="flex-1 border-2 border-tile-600 bg-tile-300 pb-3">
			<div class="border-b border-tile-600 bg-tile-500 pb-2 pt-3 text-center">
				<h2 class="px-4 text-2xl font-bold">Monthly Subscription</h2>
				<h3 class="px-4 text-xl font-medium">$10/month</h3>
			</div>

			<ul class="mt-3 flex flex-col gap-4 px-4 text-text-300">
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to all stories and conversations with native audio</span>
				</li>
				<li class="flex items-start gap-2">
					<Checkmark />
					<span>Unlimited AI practice sentences for beginner and intermediate levels</span>
				</li>
        <li class="flex items-start gap-2">
					<Checkmark />
					<span>Access to all verbs for verb conjugation practice</span>
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
		</div>
	</div>
</section>
