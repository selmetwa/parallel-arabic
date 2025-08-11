<script lang="ts">
	import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import { PUBLIC_PRICE_ID } from '$env/static/public'
	import Checkmark from '$lib/components/Checkmark.svelte';
  let { data } = $props();

  const subscriberId = data.user?.subscriber_id;

  // Function to filter out incomplete sentences
  function filterValidSentences(sentences: any[]) {
    if (!Array.isArray(sentences)) return [];
    return sentences.filter(sentence => 
      sentence && 
      sentence.arabic?.text && 
      sentence.english?.text && 
      sentence.transliteration?.text &&
      typeof sentence.arabic.text === 'string' &&
      typeof sentence.english.text === 'string' &&
      typeof sentence.transliteration.text === 'string' &&
      sentence.arabic.text.trim() !== '' &&
      sentence.english.text.trim() !== '' &&
      sentence.transliteration.text.trim() !== ''
    );
  }

  // Process user generated stories for display
  let userGeneratedStories = $derived.by(() => {
    const output = []

    for (const story of data.userGeneratedStories) {
      const storyBody = JSON.parse(story.story_body)

      // Filter valid sentences and get the count
      const validSentences = filterValidSentences(storyBody.sentences || []);

      output.push({
        id: story.id,
        title: `${storyBody.title?.english || ''} / ${storyBody.title?.arabic || ''}`,
        description: story.description,
        createdAt: story.created_at,
        difficulty: story.difficulty,
        dialect: story.dialect,
        length: validSentences.length
      })
    }
    return output
  })

  // Format date for display
  function formatDate(timestamp: number | bigint) {
    return new Date(Number(timestamp)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
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

  <div class="max-w-6xl mx-auto px-4 sm:px-8 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Subscription Section -->
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
              <ul class="grid grid-cols-1 gap-3 text-text-300">
                <li class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-1">
                    <Checkmark />
                  </div>
                  <span class="text-sm leading-relaxed">Access to all stories and conversations</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-1">
                    <Checkmark />
                  </div>
                  <span class="text-sm leading-relaxed">Unlimited AI practice sentences for beginner and intermediate levels</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-1">
                    <Checkmark />
                  </div>
                  <span class="text-sm leading-relaxed">Access to all verbs for verb conjugation practice</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-1">
                    <Checkmark />
                  </div>
                  <span class="text-sm leading-relaxed">Access to over 6,000 vocabulary words for writing and handwriting practice</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-1">
                    <Checkmark />
                  </div>
                  <span class="text-sm leading-relaxed">Access to over 6,000 vocabulary words and multiple choice quizzes</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-1">
                    <Checkmark />
                  </div>
                  <span class="text-sm leading-relaxed">Access to custom built Anki decks for Egyptian Arabic</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-1">
                    <Checkmark />
                  </div>
                  <span class="text-sm leading-relaxed">Access to Alphabet learning</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="flex-shrink-0 mt-1">
                    <Checkmark />
                  </div>
                  <span class="text-sm leading-relaxed">Save keywords and phrases to personal wordbank</span>
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

      <!-- Generated Stories Section -->
      <div class="border-2 border-tile-600 bg-tile-400 shadow-lg">
        <div class="p-6 sm:p-8">
          <div class="text-center mb-6">
            <h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-3">Your Generated Stories</h2>
          </div>

          {#if userGeneratedStories.length === 0}
            <!-- No stories CTA -->
            <div class="text-center py-8">
              <div class="text-5xl mb-4">📚</div>
              <h3 class="text-xl text-text-300 font-bold mb-3">No Stories Yet</h3>
              <p class="text-text-200 mb-4 text-sm">
                Start creating personalized Arabic stories to practice reading and comprehension!
              </p>
              <div class="flex flex-col gap-2">
                <a href="/egyptian-arabic/stories" class="text-decoration-none">
                  <Button type="button">Create Egyptian Arabic Story</Button>
                </a>
                <a href="/fusha/stories" class="text-decoration-none">
                  <Button type="button">Create Fusha Story</Button>
                </a>
              </div>
            </div>
          {:else}
            <!-- Stories grid - limited to 3 for the sidebar -->
            <div class="space-y-3 mb-4">
              {#each userGeneratedStories.slice(0, 3) as story}
                <a href={`/${story.dialect}/generated-stories/${story.id}`} class="block">
                  <article class="group w-full px-3 py-3 border-2 border-tile-600 text-left bg-tile-500 hover:bg-tile-600 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
                    <div class="flex flex-col gap-2">
                      <div class="flex flex-row items-start justify-between gap-2">
                        <p class="text-sm text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300 line-clamp-2 flex-1">
                          {story.title}
                        </p>
                        <span class="text-xs text-text-200 bg-tile-600 px-2 py-1 rounded-full uppercase tracking-wide flex-shrink-0">
                          {story.dialect}
                        </span>
                      </div>
                      <div class="flex flex-row justify-between items-center">
                        <p class="text-xs text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                          {story.length} Sentences • {story.difficulty}
                        </p>
                        <p class="text-xs text-text-200 opacity-75">
                          {formatDate(story.createdAt)}
                        </p>
                      </div>
                    </div>
                  </article>
                </a>
              {/each}
            </div>

            {#if userGeneratedStories.length > 3}
              <div class="text-center border-t border-tile-600 pt-4">
                <p class="text-sm text-text-200 mb-2">
                  Showing {Math.min(3, userGeneratedStories.length)} of {userGeneratedStories.length} stories
                </p>
                <a href="/profile/stories" class="text-decoration-none">
                  <Button type="button">
                    View All Stories
                  </Button>
                </a>
              </div>
            {:else}
              <!-- Create more stories CTA -->
              <div class="text-center border-t border-tile-600 pt-4">
                <p class="text-text-200 mb-3 text-sm">Create more stories?</p>
                <div class="flex flex-col gap-2">
                  <a href="/egyptian-arabic/stories" class="text-decoration-none">
                    <Button type="button">Create Another Story</Button>
                  </a>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>
</section>