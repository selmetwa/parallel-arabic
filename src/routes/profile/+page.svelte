<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import ContributionGraph from '$lib/components/ContributionGraph.svelte';
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  let isClearingWords = $state(false);
  let clearError = $state<string | null>(null);
  let clearSuccess = $state<string | null>(null);
  let showClearConfirm = $state(false);

  async function clearAllWords() {
    if (!showClearConfirm) {
      showClearConfirm = true;
      return;
    }

    isClearingWords = true;
    clearError = null;
    clearSuccess = null;

    try {
      const response = await fetch('/api/clear-all-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear words');
      }

      clearSuccess = 'All words cleared successfully!';
      showClearConfirm = false;
      
      // Redirect to review page after a short delay
      setTimeout(() => {
        goto('/review');
      }, 2000);
    } catch (error) {
      clearError = error instanceof Error ? error.message : 'Failed to clear words';
      showClearConfirm = false;
    } finally {
      isClearingWords = false;
    }
  }

  function cancelClear() {
    showClearConfirm = false;
    clearError = null;
  }
</script>

<div class="px-4 sm:px-20 pt-4 sm:mt-12">
  <h1 class="text-3xl font-bold text-text-300 mb-6">Profile</h1>
  
  <div class="space-y-6">
    <!-- Activity Graph -->
    <ContributionGraph />

    <!-- User Info -->
    <div class="bg-tile-300 border border-tile-500 p-6 rounded-lg">
      <h2 class="text-xl font-semibold text-text-300 mb-4">Account Information</h2>
      <div class="space-y-2">
        <p class="text-text-200"><strong>Email:</strong> {data.user?.email || 'Not available'}</p>
        <p class="text-text-200"><strong>User ID:</strong> {data.user?.id || 'Not available'}</p>
        <p class="text-text-200"><strong>Subscription:</strong> {data.hasActiveSubscription ? 'Active' : 'Not active'}</p>
      </div>
      
      <!-- Logout Form -->
      <form method="POST" action="?/logout" use:enhance class="mt-4">
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Sign Out
        </Button>
      </form>
    </div>

    <!-- Generated Stories Section -->
    <div class="bg-tile-300 border border-tile-500 p-6 rounded-lg">
      <h2 class="text-xl font-semibold text-text-300 mb-4">Your Generated Stories</h2>
      {#if data.userGeneratedStories && data.userGeneratedStories.length > 0}
        <div class="grid gap-2">
          {#each data.userGeneratedStories as story}
            <div class="bg-tile-400 p-3 rounded border border-tile-600">
              <p class="text-text-300 font-medium">{story.story_body.title.english}</p>
              <p class="text-text-200 text-sm">{story.dialect} • {new Date(story.created_at).toLocaleDateString()}</p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-text-200">No generated stories yet. Create your first AI-powered story!</p>
        <a href="/egyptian-arabic/stories" class="text-blue-500 underline">Create a story</a>
      {/if}
    </div>

    <!-- Saved Words Section -->
    <div class="bg-tile-300 border border-tile-500 p-6 rounded-lg">
      <h2 class="text-xl font-semibold text-text-300 mb-4">Review Deck</h2>
      <p class="text-text-200 mb-4">Manage your review deck and saved words.</p>
      <div class="flex flex-col gap-3">
        <a href="/profile/saved-words" class="text-blue-500 underline">View Saved Words</a>
        <a href="/review" class="text-blue-500 underline">Go to Review</a>
        
        <div class="border-t border-tile-600 pt-4 mt-4">
          <h3 class="text-lg font-semibold text-text-300 mb-2">Danger Zone</h3>
          <p class="text-text-200 text-sm mb-4">Clear all words from your review deck. This action cannot be undone.</p>
          
          {#if clearError}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p class="font-semibold">Error</p>
              <p>{clearError}</p>
            </div>
          {/if}

          {#if clearSuccess}
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p class="font-semibold">Success!</p>
              <p>{clearSuccess}</p>
            </div>
          {/if}

          {#if showClearConfirm}
            <div class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
              <p class="font-semibold mb-2">⚠️ Confirm Action</p>
              <p class="mb-4">Are you sure you want to delete all words from your review deck? This action cannot be undone.</p>
              <div class="flex gap-2">
                <Button 
                  onClick={clearAllWords} 
                  type="button" 
                  disabled={isClearingWords}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isClearingWords ? 'Clearing...' : 'Yes, Clear All Words'}
                </Button>
                <Button 
                  onClick={cancelClear} 
                  type="button"
                  disabled={isClearingWords}
                >
                  Cancel
                </Button>
              </div>
            </div>
          {:else}
            <Button 
              onClick={clearAllWords} 
              type="button"
              disabled={isClearingWords}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear All Review Words
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>