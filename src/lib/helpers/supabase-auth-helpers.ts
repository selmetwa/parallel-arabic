import type { Session, User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js'

/**
 * Sync Supabase user with Supabase database
 * Call this after successful authentication to ensure user exists in your user table
 */
export async function syncSupabaseUserWithDB(supabaseUser: SupabaseUser, supabase: SupabaseClient) {
  try {
    // Check if user already exists by supabase_auth_id (for migrated users)
    const { data: existingUser, error: selectError } = await supabase
      .from('user')
      .select('id, email, supabase_auth_id')
      .eq('supabase_auth_id', supabaseUser.id)
      .single()

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw selectError
    }

    if (existingUser) {
      // User exists (migrated user), update any changed fields
      const { data: updatedUser, error: updateError } = await supabase
        .from('user')
        .update({
          email: supabaseUser.email!,
          email_verified: 0,
          name: supabaseUser.user_metadata?.full_name || null,
          picture: supabaseUser.user_metadata?.avatar_url || null,
        })
        .eq('supabase_auth_id', supabaseUser.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return updatedUser
    } else {
      // Create new user in our database (new signup)
      // Generate a custom ID for new users to maintain consistency
      const customUserId = Math.random().toString(36).substring(2, 15)
      
      const { data: newUser, error: insertError } = await supabase
        .from('user')
        .insert({
          id: customUserId,  // Use custom ID format like existing users
          email: supabaseUser.email!,
          email_verified: 0,
          name: supabaseUser.user_metadata?.full_name || null,
          picture: supabaseUser.user_metadata?.avatar_url || null,
          is_subscriber: false,
          auth_provider: 'supabase',
          supabase_auth_id: supabaseUser.id,  // Link to Supabase auth
          sentences_viewed: 0,
          verb_conjugation_tenses_viewed: 0,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      return newUser
    }
  } catch (error) {
    console.error('Error syncing Supabase user with database:', error)
    throw error
  }
}

/**
 * Get user subscription status for Supabase user
 * This integrates with your existing subscription logic
 */
export async function getSupabaseUserSubscriptionStatus(supabaseUser: SupabaseUser, supabase: SupabaseClient) {
  try {
    const { data: user, error } = await supabase
      .from('user')
      .select(`
        id, 
        email, 
        email_verified, 
        name, 
        picture, 
        is_subscriber,
        subscriber_id,
        subscription_end_date,
        supabase_auth_id
      `)
      .eq('supabase_auth_id', supabaseUser.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!user) {
      // User doesn't exist in our DB yet, sync them
      await syncSupabaseUserWithDB(supabaseUser, supabase)
      return {
        isSubscribed: false,
        user: null
      }
    }

    // Use your existing subscription logic
    const BLESSED_EMAILS: string[] = [] // Import this from your constants if needed
    const subscriptionEndDate = user.subscription_end_date ? new Date(user.subscription_end_date) : null
    const isSubscribed = !!(                         
      user.is_subscriber ||                           
      BLESSED_EMAILS.includes(user.email || '') ||   
      (subscriptionEndDate && new Date() < subscriptionEndDate)
    )

    return {
      isSubscribed,
      user
    }
  } catch (error) {
    console.error('Error getting Supabase user subscription status:', error)
    return {
      isSubscribed: false,
      user: null
    }
  }
}

/**
 * Middleware helper to check Supabase authentication
 * Use this in protected routes
 */
export function requireSupabaseAuth(session: Session | null) {
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

/**
 * Convert Supabase session to format compatible with existing auth checks
 * This helps with gradual migration
 */
export function convertSupabaseSessionToLegacyFormat(session: Session | null) {
  if (!session) return null

  return {
    user: {
      userId: session.user.id,
      email: session.user.email,
      emailVerified: !!session.user.email_confirmed_at
    }
  }
}
