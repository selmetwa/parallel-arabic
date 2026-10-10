import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers'
import { sendWelcomeEmail } from '$lib/server/email'
import { ADMIN_ID } from '$env/static/private'
import { NEXT_COOKIE, safeNext, withNewSignup } from '$lib/helpers/safe-next'

export const GET: RequestHandler = async ({ url, cookies, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next') ?? cookies.get(NEXT_COOKIE))
  cookies.delete(NEXT_COOKIE, { path: '/' })

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
        if (isNewUser && data.user.email && data.user.id) {
          const newUserId = data.user.id;
            sendWelcomeEmail(data.user.email, newUserId).catch(error => {
              console.error('Failed to send welcome email:', error)
              // Don't block authentication if email fails
            })
        }
      } catch (syncError) {
        console.error('❌ Failed to sync user to database:', syncError)
        // Continue with login even if sync fails - can be retried later
      }
      
      // If it's a new user, redirect with newSignup flag to trigger onboarding
      const redirectUrl = isNewUser ? withNewSignup(next) : next
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