import { createServerClient } from '@supabase/ssr'
import { type Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public'

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      /**
       * SvelteKit's cookies API requires `path` to be explicitly set in
       * the cookie options. Setting `path` to `/` replicates previous/
       * standard behavior.
       */
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
      },
    },
  })

  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safeGetSession = async () => {
    console.log('🔍 [hooks.server.ts] safeGetSession started')
    
    try {
      console.log('🔍 [hooks.server.ts] Getting session from Supabase...')
      const {
        data: { session },
      } = await event.locals.supabase.auth.getSession()
      
      if (!session) {
        console.log('🔍 [hooks.server.ts] No session found')
        return { session: null, user: null }
      }

      console.log('🔍 [hooks.server.ts] Session found, getting user...')
      const {
        data: { user },
        error,
      } = await event.locals.supabase.auth.getUser()
      
      if (error) {
        console.error('❌ [hooks.server.ts] Error fetching user from auth:', error)
        // JWT validation has failed
        await event.locals.supabase.auth.signOut()
        return { session: null, user: null }
      }

      console.log('🔍 [hooks.server.ts] Auth user found, querying database user...', { 
        authUserId: user?.id,
        authUserEmail: user?.email 
      })
      
      // query the user from the database
      const { 
        data: realUser, 
        error: realUserError
      } = await event.locals.supabase.from('user').select('*').eq('supabase_auth_id', user?.id).single()
      
      if (realUserError) {
        console.error('❌ [hooks.server.ts] Error fetching user from database:', realUserError)
        console.error('❌ [hooks.server.ts] Database query details:', { 
          supabase_auth_id: user?.id,
          errorCode: realUserError.code,
          errorMessage: realUserError.message 
        })
        await event.locals.supabase.auth.signOut()
        return { session: null, user: null }
      }

      if (!realUser) {
        console.error('❌ [hooks.server.ts] User not found in database for auth ID:', user?.id)
        await event.locals.supabase.auth.signOut()
        return { session: null, user: null }
      }

      console.log('✅ [hooks.server.ts] Successfully retrieved user:', { 
        dbUserId: realUser.id,
        dbUserEmail: realUser.email 
      })
      return { session, user: realUser }
      
    } catch (error) {
      console.error('❌ [hooks.server.ts] Unexpected error in safeGetSession:', error)
      console.error('❌ [hooks.server.ts] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return { session: null, user: null }
    }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  // Optional: Add route protection logic here
  // if (!event.locals.session && event.url.pathname.startsWith('/private')) {
  //   redirect(303, '/auth')
  // }

  return resolve(event)
}

// Auth helper that maintains compatibility with existing Lucia patterns
const auth: Handle = async ({ event, resolve }) => {
  // Create auth object similar to Lucia's locals.auth for backward compatibility
  event.locals.auth = {
    validate: async () => {
      const { session, user } = await event.locals.safeGetSession()
      if (!session || !user) return null
      
      return {
        sessionId: session.access_token,
        user: {
          id: user.id,
          email: user.email || undefined,
          supabase_auth_id: user.supabase_auth_id
        }
      }
    },
    setSession: () => {
      // Session management should be handled client-side with Supabase
    },
    invalidateSession: async () => {
      await event.locals.supabase.auth.signOut()
    }
  }

  return resolve(event)
}

export const handle: Handle = sequence(supabase, authGuard, auth)