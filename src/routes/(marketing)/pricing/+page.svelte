<script>
  import Checkmark from "$lib/components/Checkmark.svelte";
</script>
<section class="mt-14 px-6 sm:px-8 py-8 flex flex-col gap-6">
  <h1 class="text-text-300 text-5xl font-bold mx-auto">Pricing</h1>
  <div class="flex flex-col sm:flex-row mx-4 lg:mx-40 gap-3">
    <div class="flex-1 border-2 border-tile-500">
      <div class="border-b border-tile-600 text-center bg-tile-300 pt-3 pb-2">
        <h2 class="px-4 text-2xl font-bold">Free Tier</h2>
        <h3 class="px-4 text-xl font-medium">$0/month</h3>
      </div>
      <ul class="text-text-300 flex flex-col gap-4 px-4 mt-3">
        <li class="flex items-center gap-2 items-start">
          <Checkmark />
          <span>Access to one story</span>
        </li>
        <li class="flex gap-2 items-start">
          <Checkmark />
          <span>Access to Alphabet learning</span>
        </li>
      </ul>
    </div>
    <div class="flex-1 border-2 border-tile-600 bg-tile-300 pb-3">
      <div class="border-b border-tile-600 text-center bg-tile-500 pt-3 pb-2">
        <h2 class="px-4 text-2xl font-bold">Monthly Subscription</h2>
        <h3 class="px-4 text-xl font-medium">$5/month</h3>
      </div>

      <ul class="text-text-300 flex flex-col gap-4 px-4 mt-3">
        <li class="flex items-center gap-2 items-start">
          <Checkmark />
          <span>Access to all stories and conversations</span>
        </li>
        <li class="flex gap-2 items-start">
          <Checkmark />
          <span>Unlimited practice sentences for beginner and intermediate levels</span>
        </li>
        <li class="flex gap-2 items-start">
          <Checkmark />
          <span>Access to 4,100 vocabulary words for writing and handwriting practice</span>
        </li>
        <li class="flex gap-2 items-start">
          <Checkmark />
          <span>Access to 4,100 vocabulary words and multiple choice quizzes</span>
        </li>
        <li class="flex gap-2 items-start">
          <Checkmark />
          <span>Access to Alphabet learning</span>
        </li>
        <li class="flex gap-2 items-start">
          <Checkmark />
          <span>Save keywords and phrases to personal wordbank</span>
        </li>
      </ul>
    </div>
  </div>
</section>