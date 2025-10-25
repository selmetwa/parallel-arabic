<script lang="ts">
  import { enhance } from '$app/forms'
  import Button from './Button.svelte'

  interface Props {
    session: any
    user: any
  }

  let { session, user }: Props = $props()
  let loading = $state(false)
</script>

{#if session && user}
  <div class="flex items-center gap-3">
    <span class="text-text-300">Welcome, {user.email}</span>
    <form 
      method="POST" 
      action="/auth/logout"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          console.log({update})
          // await update();
        };
      }}
      class="inline"
    >
      <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
        {loading ? 'Signing out...' : 'Sign Out'}
      </Button>
    </form>
  </div>
{:else}
  <div class="flex items-center gap-3">
    <a href="/login" class="text-text-200 hover:text-text-300 underline">
      Sign In
    </a>
    <a href="/signup" class="text-text-200 hover:text-text-300 underline">
      Sign Up
    </a>
  </div>
{/if}
