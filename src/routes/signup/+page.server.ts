import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers'

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
    if (data.user) {
      try {
        await syncSupabaseUserWithDB(data.user, supabase)
      } catch (syncError) {
        console.error('Failed to sync user to database:', syncError)
        // Note: We don't return an error here because the auth was successful
        // The user sync can be retried on login
      }
    }
    
    return {
      message: 'Check your email for the confirmation link!'
    }
  }
}