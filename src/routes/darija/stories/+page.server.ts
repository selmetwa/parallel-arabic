import { db } from '$lib/server/db';

export const load = async ({ parent }) => {
  // Get session and subscription status from layout (no DB query for auth needed!)
  const { session, isSubscribed } = await parent();
  
  // Only fetch generated stories from DB
  const user_generated_stories = await db
    .selectFrom('generated_story')
    .selectAll()
    .where('dialect', '=', 'darija')
    .orderBy('created_at', 'desc')
    .execute();

  return {
    session,  // Use from layout!
    isSubscribed,  // Use from layout!
    hasActiveSubscription: isSubscribed,  // Keep for backward compatibility
    user_generated_stories
  }
}; 