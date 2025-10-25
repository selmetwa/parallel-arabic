import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const load = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession()

  // If already logged in, redirect to home
  if (session) {
    redirect(303, '/')
  }

  return {}
}

export const actions: Actions = {
  login: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    console.log({ data, error })

    if (error) {
      return {
        error: error.message
      }
    }

    redirect(303, '/')
  },

  resetPassword: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/auth/reset-password`
    })

    if (error) {
      return {
        error: error.message
      }
    }

    return {
      message: 'Check your email for the password reset link!'
    }
  }
}