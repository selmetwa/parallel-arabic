<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  console.log({ data });
</script>

<div class="px-4 sm:px-20 pt-4 sm:mt-12">
  <h1 class="text-3xl font-bold text-text-300 mb-6">Profile</h1>
  
  <div class="space-y-6">
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
      <h2 class="text-xl font-semibold text-text-300 mb-4">Saved Words</h2>
      <p class="text-text-200">View your saved words collection.</p>
      <a href="/profile/saved-words" class="text-blue-500 underline">View Saved Words</a>
    </div>
  </div>
</div>