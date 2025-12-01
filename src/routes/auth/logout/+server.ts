import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals, cookies, request, url }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (locals as any).supabase;
  console.log('🔍 [logout] POST request received');
  console.log('🔍 [logout] URL:', url.pathname);
  console.log('🔍 [logout] Referer:', request.headers.get('referer'));
  console.log('🔍 [logout] User-Agent:', request.headers.get('user-agent'));
  
  try {
    console.log('🔍 [logout] Attempting to sign out from Supabase...');
    // Sign out from Supabase (this clears the auth cookies)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ [logout] Supabase signout error:', error);
      console.error('❌ [logout] Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ [logout] Supabase signout successful');
    }

    console.log('🔍 [logout] Clearing auth-related cookies...');
    // Additional cleanup: manually clear any auth-related cookies
    const cookieOptions = { 
      path: '/', 
      maxAge: 0 // This deletes the cookie
    }
    
    // Clear common Supabase auth cookies
    cookies.delete('sb-access-token', cookieOptions)
    cookies.delete('sb-refresh-token', cookieOptions)
    console.log('✅ [logout] Cleared sb-access-token and sb-refresh-token');
    
    // Clear any cookies that match the pattern sb-{project-id}-auth-token
    const allCookies = cookies.getAll()
    console.log('🔍 [logout] All cookies before cleanup:', allCookies.map(c => c.name));
    
    let deletedCount = 0;
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
        cookies.delete(cookie.name, cookieOptions)
        deletedCount++;
        console.log(`✅ [logout] Deleted cookie: ${cookie.name}`);
      }
    })
    console.log(`✅ [logout] Deleted ${deletedCount} Supabase auth cookies`);
    
    console.log('✅ [logout] Logout process completed successfully');
  } catch (error) {
    console.error('❌ [logout] Error during logout:', error);
    console.error('❌ [logout] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
  
  console.log('🔍 [logout] Redirecting to home page...');
  // Always redirect to home, even if there were errors
  redirect(303, '/')
}
