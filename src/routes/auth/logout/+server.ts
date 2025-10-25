import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals: { supabase }, cookies }) => {
  try {
    // Sign out from Supabase (this clears the auth cookies)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Supabase signout error:', error)
    }

    // Additional cleanup: manually clear any auth-related cookies
    const cookieOptions = { 
      path: '/', 
      maxAge: 0 // This deletes the cookie
    }
    
    // Clear common Supabase auth cookies
    cookies.delete('sb-access-token', cookieOptions)
    cookies.delete('sb-refresh-token', cookieOptions)
    
    // Clear any cookies that match the pattern sb-{project-id}-auth-token
    const allCookies = cookies.getAll()
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
        cookies.delete(cookie.name, cookieOptions)
      }
    })
  } catch (error) {
    console.error('Error during logout:', error)
  }
  
  console.log('logout successful')
  // Always redirect to home, even if there were errors
  redirect(303, '/')
}
