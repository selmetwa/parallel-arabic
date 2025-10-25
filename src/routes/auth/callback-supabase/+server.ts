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
        console.log('Successfully authenticated user:', data.user.email)
        
        // Sync user data with your existing database
        try {
          await syncSupabaseUserWithDB(data.user, supabase)
          console.log('User synced to database:', data.user.email)
        } catch (syncError) {
          console.error('Failed to sync user to database:', syncError)
          // Continue with login even if sync fails - can be retried later
        }
        
        throw redirect(303, next)
      }
    } catch (err) {
      console.error('Unexpected error during authentication:', err)
      throw redirect(303, `/login?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // If no code, redirect to login
  throw redirect(303, '/login')
}
