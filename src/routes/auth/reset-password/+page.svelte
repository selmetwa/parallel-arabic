<script lang="ts">
  import { supabase } from '$lib/supabaseClient'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import Button from '$lib/components/Button.svelte'

  let password = $state('')
  let confirmPassword = $state('')
  let loading = $state(false)
  let error = $state('')
  let message = $state('')
  let session = $state<any>(null)

  // Get the session from the layout data instead of trying to fetch it again
  $effect(() => {
    if ($page.data?.session) {
      console.log('✅ [reset-password] Session received from layout:', { 
        userId: $page.data.session?.user?.id,
        email: $page.data.session?.user?.email 
      })
      session = $page.data.session
    }
  })

  onMount(() => {
    console.log('🔍 [reset-password] onMount started')
    console.log('🔍 [reset-password] Page data:', { 
      hasPageData: !!$page.data,
      hasSession: !!$page.data?.session,
      hasUser: !!$page.data?.user
    })
    
    // Check if we already have session from page data
    if ($page.data?.session) {
      console.log('✅ [reset-password] Session found in page data')
      session = $page.data.session
    } else {
      console.log('❌ [reset-password] No session in page data, redirecting to login')
      goto('/login?error=Invalid reset link or session expired')
    }

    // Listen for auth changes using the supabase client from layout
    const supabaseClient = $page.data?.supabase || supabase
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, _session) => {
      console.log('🔄 [reset-password] Auth state changed:', { event: _event, hasSession: !!_session })
      session = _session
      
      if (!_session && _event !== 'SIGNED_OUT') {
        console.log('❌ [reset-password] Session lost, redirecting to login')
        goto('/login?error=Session expired')
      }
    })

    return () => {
      console.log('🧹 [reset-password] Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  })

  async function handlePasswordReset(event: Event) {
    event.preventDefault()
    console.log('🔍 [reset-password] Starting password reset...')
    loading = true
    error = ''
    message = ''

    // Validate passwords
    if (password !== confirmPassword) {
      error = 'Passwords do not match'
      loading = false
      return
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters'
      loading = false
      return
    }

    try {
      console.log('🔍 [reset-password] Updating password with Supabase...')
      const supabaseClient = $page.data?.supabase || supabase
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('❌ [reset-password] Password update error:', updateError)
        error = updateError.message
      } else {
        console.log('✅ [reset-password] Password updated successfully!')
        message = 'Password updated successfully! Redirecting...'
        // Redirect after a short delay
        setTimeout(() => {
          goto('/')
        }, 2000)
      }
    } catch (err) {
      console.error('❌ [reset-password] Unexpected error:', err)
      error = 'An unexpected error occurred'
    }

    loading = false
  }
</script>

<svelte:head>
  <title>Reset Password - Supabase Auth</title>
  <meta name="description" content="Reset your password" />
</svelte:head>

<main class="min-h-screen bg-tile-200 py-12">
  <div class="container mx-auto px-4">
    <div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-8 px-6 sm:mx-36">
      <h1 class="text-2xl font-bold text-text-300 mb-6 text-center">
        Reset Your Password
      </h1>

      {#if session}
        {console.log('✅ [reset-password] Rendering form - session exists:', { userId: session?.user?.id, email: session?.user?.email })}
        <form onsubmit={handlePasswordReset} class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-text-200 mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              bind:value={password}
              placeholder="At least 6 characters"
              required
              disabled={loading}
              minlength="6"
              class="w-full px-3 py-2 border border-tile-600 bg-tile-200 text-text-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-text-200 mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              placeholder="Confirm your new password"
              required
              disabled={loading}
              minlength="6"
              class="w-full px-3 py-2 border border-tile-600 bg-tile-200 text-text-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {#if error}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          {/if}

          {#if message}
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          {/if}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Updating password...' : 'Update Password'}
          </Button>
        </form>
      {:else}
        {console.log('❌ [reset-password] No session - showing loading state')}
        <div class="text-center">
          <p class="text-text-200 mb-4">
            Loading reset session...
          </p>
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-text-300 mx-auto"></div>
        </div>
      {/if}

      <div class="mt-6 text-center">
        <a href="/login-supabase" class="text-blue-500 hover:text-blue-600 underline">
          Back to Sign In
        </a>
      </div>
    </div>
  </div>
</main>
