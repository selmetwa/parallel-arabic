<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import ContributionGraph from '$lib/components/ContributionGraph.svelte';
  import ReviewWordsStats from './components/ReviewWordsStats.svelte';
  import AllTimeStats from '$lib/components/AllTimeStats.svelte';
  import type { PageData } from './$types';
  import { goto, invalidateAll, invalidate } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  let isClearingWords = $state(false);
  let clearError = $state<string | null>(null);
  let clearSuccess = $state<string | null>(null);
  let showClearConfirm = $state(false);
  
  let dialectUpdateSuccess = $state<string | null>(null);
  let dialectUpdateError = $state<string | null>(null);

  const dialectFlags: Record<string, string> = {
    'egyptian-arabic': '🇪🇬',
    'darija': '🇲🇦',
    'levantine': '🇱🇧',
    'fusha': '🇸🇦'
  };

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic', flag: '🇪🇬' },
    { value: 'darija', label: 'Moroccan Darija', flag: '🇲🇦' },
    { value: 'levantine', label: 'Levantine Arabic', flag: '🇱🇧' },
    { value: 'fusha', label: 'Modern Standard Arabic (Fusha)', flag: '🇸🇦' }
  ];

  const currentDialect = data.targetDialect || 'egyptian-arabic';

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

<div class="px-4 sm:px-8 lg:px-12 xl:px-20 pt-4 sm:pt-8 pb-12 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-4xl font-bold text-text-300 mb-2">Profile</h1>
    <p class="text-text-200">Manage your account and view your learning progress</p>
  </div>
  
  <div class="space-y-8">
    <!-- Stats Section -->
    <section>
      <h2 class="text-2xl font-bold text-text-300 mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>Your Statistics</span>
      </h2>
  <div class="space-y-6">
    <!-- All-Time Stats -->
    <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6 sm:p-8 shadow-lg">
      <AllTimeStats user={data.user} />
    </div>

        <!-- Review Words Stats -->
    <ReviewWordsStats wordStats={data.wordStats} />

    <!-- Activity Graph -->
        <div class="bg-tile-300 border border-tile-500 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-text-300 mb-4">Activity Graph</h3>
    <ContributionGraph />
        </div>
      </div>
    </section>

    <!-- Account Settings Section -->
    <section>
      <h2 class="text-2xl font-bold text-text-300 mb-4 flex items-center gap-2">
        <span>⚙️</span>
        <span>Account Settings</span>
      </h2>
      <div class="bg-tile-300 border border-tile-500 rounded-xl p-6 shadow-sm">
        <div class="space-y-6">
          <!-- Basic Info -->
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-text-300 border-b border-tile-500 pb-2">Basic Information</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-text-200 mb-1">Email</label>
                <p class="text-text-300 text-lg">{data.user?.email || 'Not available'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-text-200 mb-1">Subscription Status</label>
                <p class="text-text-300 text-lg">
                  <span class={data.hasActiveSubscription ? "text-green-400 font-semibold" : "text-text-200"}>
                    {data.hasActiveSubscription ? '✓ Active' : 'Not active'}
            </span>
          </p>
              </div>
            </div>
          </div>

          <!-- Learning Preferences -->
          <div class="space-y-3 border-t border-tile-500 pt-4">
            <h3 class="text-lg font-semibold text-text-300 mb-2">Learning Preferences</h3>
            
            <!-- Learning Dialect Selection -->
            <div class="space-y-3">
              <label for="target_dialect" class="block text-sm font-medium text-text-200">
                Learning Dialect
              </label>
              <form 
                method="POST" 
                action="?/updateTargetDialect" 
                use:enhance={() => {
                  dialectUpdateSuccess = null;
                  dialectUpdateError = null;
                  return async ({ result, update }) => {
                    if (result.type === 'success' && result.data?.success) {
                      await invalidate('supabase:auth');
                      await invalidate('/');
                      await update();
                      await invalidateAll();
                      dialectUpdateSuccess = 'Dialect updated successfully!';
                    } else if (result.type === 'failure') {
                      await update();
                      const errorMsg = result.data?.error;
                      dialectUpdateError = typeof errorMsg === 'string' ? errorMsg : 'Failed to update dialect';
                    } else if (result.type === 'error') {
                      await update();
                      dialectUpdateError = result.error?.toString() || 'Failed to update dialect';
                    } else {
                      await update();
                    }
                  };
                }}
                class="flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <select
                  id="target_dialect"
                  name="target_dialect"
                  class="flex-1 bg-tile-400 border border-tile-600 text-text-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-tile-500 text-base"
                >
                  {#each dialectOptions as option}
                    <option value={option.value} selected={currentDialect === option.value}>
                      {option.flag} {option.label}
                    </option>
                  {/each}
                </select>
                <Button type="submit">Update Dialect</Button>
              </form>
              {#if dialectUpdateSuccess}
                <div class="bg-green-500/20 border border-green-400 text-green-300 px-4 py-2 rounded-lg text-sm">
                  {dialectUpdateSuccess}
                </div>
              {/if}
              {#if dialectUpdateError}
                <div class="bg-red-500/20 border border-red-400 text-red-300 px-4 py-2 rounded-lg text-sm">
                  {dialectUpdateError}
                </div>
        {/if}
            </div>

            {#if data.learningReason || data.proficiencyLevel}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {#if data.learningReason}
                  <div>
                    <label class="block text-sm font-medium text-text-200 mb-1">Learning Reason</label>
                    <p class="text-text-300">{data.learningReason}</p>
                  </div>
        {/if}
        {#if data.proficiencyLevel}
                  <div>
                    <label class="block text-sm font-medium text-text-200 mb-1">Proficiency Level</label>
                    <p class="text-text-300">{data.proficiencyLevel}</p>
                  </div>
                {/if}
              </div>
        {/if}
      </div>
      
          <!-- Account Actions -->
          <div class="border-t border-tile-500 pt-4">
            <h3 class="text-lg font-semibold text-text-300 mb-3">Account Actions</h3>
            <Button 
              type="button"
              onClick={async () => {
                console.log('🔍 [profile] Logout button clicked');
                
                try {
                  const response = await fetch('/auth/logout', {
                    method: 'POST',
                    credentials: 'include' // Include cookies
                  });
                  
                  console.log('🔍 [profile] Logout response status:', response.status);
                  console.log('🔍 [profile] Logout response URL:', response.url);
                  
                  // Invalidate all data and navigate to home
                  console.log('✅ [profile] Logout successful, navigating to home');
                  await invalidateAll();
                  await goto('/', { invalidateAll: true });
                } catch (error) {
                  console.error('❌ [profile] Error during logout:', error);
                  // Even on error, try to navigate home
                  await invalidateAll();
                  await goto('/', { invalidateAll: true });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Content Section -->
    <section>
      <h2 class="text-2xl font-bold text-text-300 mb-4 flex items-center gap-2">
        <span>📚</span>
        <span>Your Content</span>
      </h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Generated Stories -->
        <div class="bg-tile-300 border border-tile-500 rounded-xl p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-text-300 mb-4">Generated Stories</h3>
      {#if data.userGeneratedStories && data.userGeneratedStories.length > 0}
            <div class="space-y-3">
          {#each data.userGeneratedStories as story}
                <div class="bg-tile-400 p-4 rounded-lg border border-tile-600 hover:border-tile-500 transition-colors">
                  <p class="text-text-300 font-medium mb-1">{story.story_body.title.english}</p>
              <p class="text-text-200 text-sm">{story.dialect} • {new Date(story.created_at).toLocaleDateString()}</p>
            </div>
          {/each}
        </div>
      {:else}
            <div class="text-center py-8">
              <p class="text-text-200 mb-3">No generated stories yet</p>
              <a href="/stories" class="text-blue-400 hover:text-blue-300 underline font-medium">
                Create your first story →
              </a>
            </div>
      {/if}
    </div>

        <!-- Review Deck Management -->
        <div class="bg-tile-300 border border-tile-500 rounded-xl p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-text-300 mb-4">Review Deck</h3>
          <p class="text-text-200 mb-4 text-sm">Manage your vocabulary review deck</p>
          
          <div class="space-y-3 mb-6">
            <a 
              href="/review/all-words" 
              class="block w-full bg-tile-400 hover:bg-tile-500 border border-tile-600 rounded-lg px-4 py-3 text-text-300 font-medium transition-colors text-center"
            >
              View All Review Words
            </a>
            <a 
              href="/review" 
              class="block w-full bg-tile-400 hover:bg-tile-500 border border-tile-600 rounded-lg px-4 py-3 text-text-300 font-medium transition-colors text-center"
            >
              Go to Review
            </a>
          </div>
          
          <div class="border-t border-tile-600 pt-4">
            <h4 class="text-base font-semibold text-text-300 mb-2 flex items-center gap-2">
              <span>⚠️</span>
              <span>Danger Zone</span>
            </h4>
            <p class="text-text-200 text-sm mb-4">Clear all words from your review deck. This action cannot be undone.</p>
          
          {#if clearError}
              <div class="bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded-lg mb-4">
                <p class="font-semibold mb-1">Error</p>
                <p class="text-sm">{clearError}</p>
            </div>
          {/if}

          {#if clearSuccess}
              <div class="bg-green-500/20 border border-green-400 text-green-300 px-4 py-3 rounded-lg mb-4">
                <p class="font-semibold mb-1">Success!</p>
                <p class="text-sm">{clearSuccess}</p>
            </div>
          {/if}

          {#if showClearConfirm}
              <div class="bg-yellow-500/20 border border-yellow-400 text-yellow-300 px-4 py-3 rounded-lg mb-4">
              <p class="font-semibold mb-2">⚠️ Confirm Action</p>
                <p class="text-sm mb-4">Are you sure you want to delete all words from your review deck? This action cannot be undone.</p>
              <div class="flex gap-2">
                <Button 
                  onClick={clearAllWords} 
                  type="button" 
                  disabled={isClearingWords}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                >
                    {isClearingWords ? 'Clearing...' : 'Yes, Clear All'}
                </Button>
                <Button 
                  onClick={cancelClear} 
                  type="button"
                  disabled={isClearingWords}
                    className="flex-1"
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
                className="bg-red-600 hover:bg-red-700 w-full"
            >
              Clear All Review Words
            </Button>
          {/if}
        </div>
      </div>
    </div>
    </section>
  </div>
</div>