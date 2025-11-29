import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import type { LayoutLoad } from './$types'
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

export const prerender = false; // Default to not prerender
export const ssr = false;

// Helper to detect if running in Capacitor native app
const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
};

// Only inject Vercel Speed Insights when NOT in native app
if (typeof window !== 'undefined' && !isNativeApp()) {
  injectSpeedInsights();
}

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  try {
    /**
     * Declare a dependency so the layout can be invalidated, for example, on
     * session refresh.
     */
    depends('supabase:auth')

    const supabase = isBrowser()
      ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
          global: {
            fetch,
          },
        })
      : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
          global: {
            fetch,
          },
          cookies: {
            getAll() {
              return data.cookies
            },
          },
        })

    /**
     * It's fine to use `getSession` here, because on the client, `getSession` is
     * safe, and on the server, it reads `session` from the `LayoutData`, which
     * safely checked the session using `safeGetSession`.
     */
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Preserve showOnboarding from server data
    return { 
      session, 
      supabase, 
      user,
      showOnboarding: data.showOnboarding ?? false
    }
  } catch (error) {
    console.error('❌ [+layout.ts] Error in client layout load:', error)
    console.error('❌ [+layout.ts] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Try to create a basic client for fallback
    try {
      console.log('🔄 [+layout.ts] Attempting fallback client creation...')
      const fallbackSupabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        global: { fetch },
      })
      
      return { 
        session: null, 
        supabase: fallbackSupabase, 
        user: null,
        showOnboarding: data.showOnboarding ?? false
      }
    } catch (fallbackError) {
      console.error('❌ [+layout.ts] Fallback also failed:', fallbackError)
      throw error; // Re-throw original error
    }
  }
}
