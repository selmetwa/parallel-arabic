import { db } from '$lib/server/db';
import { BLESSED_EMAILS } from '$lib/constants/blessed-emails';

export const load = async ({ locals }) => {
  const session = await locals.auth.validate();
  const userId = session?.user.userId || null;

  // Fast path: no user = no subscription
  if (!userId) {
    return {
      session: null,
      isSubscribed: false,
      user: null
    };
  }

  // Single optimized query with only needed fields
  const user = await db
    .selectFrom('user')
    .select([
      'id', 
      'email', 
      'email_verified', 
      'name', 
      'picture', 
      'is_subscriber',        // Primary subscription check
      'subscriber_id',        // Needed by home page for Stripe integration
      'subscription_end_date'
    ])
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!user) {
    return {
      session,
      isSubscribed: false,
      user: null
    };
  }

  // Compute subscription status inline (no extra DB query)
  const isSubscribed = !!(                         
    user.is_subscriber ||                           // Primary check: boolean field
    BLESSED_EMAILS.includes(user.email || '') ||   // Blessed emails
    (user.subscription_end_date && new Date() < new Date(user.subscription_end_date * 1000)) // Date check
  );

  return {
    session,
    isSubscribed,
    user
  };
};