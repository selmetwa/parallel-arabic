<script lang="ts">
  import Button from "./Button.svelte";
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';

  interface Props {
    handleOpenDrawer: () => void;
    session: any;
    userEmail: string;
  }

  let { handleOpenDrawer, session, userEmail }: Props = $props();
  let loading = $state(false);
</script>

<nav class="w-full border-b border-tile-600 py-4 bg-tile-300 relative">
    <menu class="w-full flex gap-4 px-4 items-center flex-wrap">
        <li><a class="text-text-300 text-sm sm:text-base underline" href="/">Home</a></li>
        <li><a class="text-text-300 text-sm sm:text-base underline" href="/about">About</a></li>
        {#if session}
          <li><a class="text-text-300 text-sm sm:text-base underline" href="/review">Review</a></li>
          <li><a class="text-text-300 text-sm sm:text-base underline" href="/profile">Profile</a></li>
        {/if}
        <menu class="ml-auto flex flex-row gap-4 items-center">
          {#if session}
            <li><span class="text-text-200 text-sm">Welcome, {userEmail}</span></li>
            <li>
              <form 
                method="POST" 
                action="/auth/logout"
                use:enhance={() => {
                  loading = true;
                  return async ({ result }) => {
                    loading = false;
                    
                    // Handle different result types
                    if (result.type === 'redirect') {
                      // Invalidate all data and navigate to the redirect location
                      await invalidateAll();
                      goto(result.location);
                    } else if (result.type === 'success') {
                      // If successful but no redirect, refresh page data and go home
                      await invalidateAll();
                      goto('/');
                    } else {
                      // For other cases, try to update normally but catch JSON errors
                      try {
                        // Don't call update() as it causes JSON parse issues with redirects
                        await invalidateAll();
                        goto('/');
                      } catch (error) {
                        console.error('Error handling logout result:', error);
                        // Fallback: hard navigation
                        window.location.href = '/';
                      }
                    }
                  };
                }}
                class="inline"
              >
                <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                  {loading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </form>
            </li>
          {:else}
            <li><a class="text-text-300 text-sm sm:text-base underline" href="/login">Login</a></li>
            <li><a class="text-text-300 text-sm sm:text-base underline" href="/signup">Sign Up</a></li>        
          {/if}
          <li>
            <Button onClick={handleOpenDrawer} type="button">
              Theme
            </Button>
          </li>
        </menu>
    </menu>
</nav>
