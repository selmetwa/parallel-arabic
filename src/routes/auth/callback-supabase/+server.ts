import { redirect } from '@sveltejs/kit'
import { supabase } from '$lib/supabaseClient'
import type { RequestHandler } from './$types'
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers'

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'
  const error = url.searchParams.get('error')
  const error_description = url.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    throw redirect(303, `/login?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        throw redirect(303, `/login?error=${encodeURIComponent('Authentication failed')}`)
      }

      if (data.session && data.user) {
        // Check if this is a new user before syncing
        const { data: existingUser, error: selectError } = await supabase
          .from('user')
          .select('id')
          .eq('supabase_auth_id', data.user.id)
          .single()
        
        // PGRST116 = no rows returned, meaning it's a new user
        const isNewUser = !existingUser && selectError?.code === 'PGRST116'
        
        // Sync user data with your existing database
        try {
          await syncSupabaseUserWithDB(data.user, supabase)
        } catch (syncError) {
          console.error('Failed to sync user to database:', syncError)
          // Continue with login even if sync fails - can be retried later
        }
        
        // If it's a new user, redirect with newSignup flag to trigger onboarding
        const redirectUrl = isNewUser ? '/?newSignup=true' : next
        throw redirect(303, redirectUrl)
      }
    } catch (err) {
      console.error('Unexpected error during authentication:', err)
      throw redirect(303, `/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // If no code, redirect to login
  throw redirect(303, '/login')
}
