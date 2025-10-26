import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { User } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';

// Create server-side Supabase client with service role key for auth verification
const supabaseServer = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Verify Supabase auth token from request headers
 * @param request - The request object containing authorization header
 * @returns Promise<User | null> - The authenticated user or null if invalid
 */
export async function verifySupabaseAuth(request: Request): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error verifying Supabase auth:', error);
    return null;
  }
}

/**
 * Require authentication for API routes
 * Throws an error response if not authenticated
 * @param request - The request object
 * @returns Promise<User> - The authenticated user
 * @throws Error with 401 status if not authenticated
 */
export async function requireSupabaseAuth(request: Request): Promise<User> {
  const user = await verifySupabaseAuth(request);
  
  if (!user) {
    throw new Response(
      JSON.stringify({ error: 'Authentication required' }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Get user from Supabase auth for server-side pages
 * Returns null if not authenticated (doesn't throw)
 * @param request - The request object
 * @returns Promise<User | null> - The authenticated user or null
 */
export async function getSupabaseUser(request: Request): Promise<User | null> {
  return await verifySupabaseAuth(request);
}

/**
 * Require authentication for server-side page loads
 * Redirects to login if not authenticated
 * @param request - The request object
 * @returns Promise<User> - The authenticated user
 * @throws redirect to login if not authenticated
 */
export async function requireSupabaseAuthForPage(request: Request): Promise<User> {
  const user = await verifySupabaseAuth(request);
  
  if (!user) {
    throw redirect(302, '/login');
  }

  return user;
}

/**
 * Check if request has valid Supabase authentication
 * @param request - The request object
 * @returns Promise<boolean> - True if authenticated
 */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const user = await verifySupabaseAuth(request);
  return !!user;
}
