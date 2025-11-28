import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers'
import { sendWelcomeEmail } from '$lib/server/email'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session && data.user) {
      // Check if this is a new user before syncing
      const { data: existingUser, error: selectError } = await supabase
        .from('user')
        .select('id')
        .eq('supabase_auth_id', data.user.id)
        .single()
      
      // PGRST116 = no rows returned, meaning it's a new user
      const isNewUser = !existingUser && selectError?.code === 'PGRST116'
      
      try {
        // Sync user data with your existing database
        await syncSupabaseUserWithDB(data.user, supabase)
        
        // Send welcome email to new users (non-blocking)
        if (isNewUser && data.user.email) {
          sendWelcomeEmail(data.user.email).catch(error => {
            console.error('Failed to send welcome email:', error)
            // Don't block authentication if email fails
          })
        }
      } catch (syncError) {
        console.error('❌ Failed to sync user to database:', syncError)
        // Continue with login even if sync fails - can be retried later
      }
      
      // If it's a new user, redirect with newSignup flag to trigger onboarding
      const redirectPath = next.startsWith('/') ? next : `/${next}`
      const redirectUrl = isNewUser ? '/?newSignup=true' : redirectPath
      redirect(303, redirectUrl)
    } else {
      console.error('❌ Code exchange failed:', error)
    }
  } else {
    console.error('❌ No authorization code received')
  }

  // return the user to an error page with instructions
  redirect(303, '/auth/error')
}