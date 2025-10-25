<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  interface Props {
    children: import('svelte').Snippet
    session: any
    redirectTo?: string
    showLoading?: boolean
  }

  let { children, session, redirectTo = '/login', showLoading = true }: Props = $props()

  onMount(() => {
    // Check auth on mount - redirect if no session
    if (!session) {
      goto(redirectTo)
    }
  })
</script>

{#if session}
  {@render children()}
{:else}
  <div class="flex items-center justify-center p-8">
    <span class="text-text-200">Redirecting to login...</span>
  </div>
{/if}
