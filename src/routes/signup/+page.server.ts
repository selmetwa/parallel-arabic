import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers'
import { sendWelcomeEmail } from '$lib/server/email'
import { ADMIN_ID } from '$env/static/private'

export const load = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession()

  // If already logged in, redirect to home
  if (session) {
    redirect(303, '/')
  }

  return {}
}

export const actions: Actions = {
  signup: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      return {
        error: error.message
      }
    }

    // If user was created, sync with our database
    let isNewUser = false
    if (data.user) {
      try {
        const { data: existingUser, error: selectError } = await supabase
          .from('user')
          .select('id')
          .eq('supabase_auth_id', data.user.id)
          .single()
        
        // Check if this is a new user (doesn't exist in our DB yet)
        // PGRST116 = no rows returned, meaning it's a new user
        isNewUser = !existingUser && selectError?.code === 'PGRST116'
        
        await syncSupabaseUserWithDB(data.user, supabase)
        
        // Send welcome email to new users (admin only, non-blocking)
        // Only send if the new user is an admin (for testing) or if admin triggers it
        if (isNewUser && email) {
          // Check if the new user is admin, or if we're in an admin context
          // For now, only allow if admin ID matches (admin creating their own account)
          const newUserId = data.user?.id;
          if (ADMIN_ID && newUserId && ADMIN_ID === newUserId) {
            sendWelcomeEmail(email, newUserId).catch(error => {
              console.error('Failed to send welcome email:', error)
              // Don't block signup if email fails
            })
          }
        }
      } catch (syncError) {
        console.error('Failed to sync user to database:', syncError)
        // Note: We don't return an error here because the auth was successful
        // The user sync can be retried on login
      }
    }
    
    // If it's a new user and they're already authenticated (email confirmation not required),
    // redirect to home with newSignup flag to trigger onboarding
    if (isNewUser && data.session) {
      throw redirect(303, '/?newSignup=true')
    }
    
    return {
      message: 'Check your email for the confirmation link!'
    }
  }
}