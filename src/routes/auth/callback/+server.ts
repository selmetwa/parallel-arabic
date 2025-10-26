import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session && data.user) {
      try {
        // Sync user data with your existing database
        await syncSupabaseUserWithDB(data.user, supabase)
      } catch (syncError) {
        console.error('❌ Failed to sync user to database:', syncError)
        // Continue with login even if sync fails - can be retried later
      }
      
      redirect(303, `/${next.slice(1)}`)
    } else {
      console.error('❌ Code exchange failed:', error)
    }
  } else {
    console.error('❌ No authorization code received')
  }

  // return the user to an error page with instructions
  redirect(303, '/auth/error')
}