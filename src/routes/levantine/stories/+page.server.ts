import { db } from '$lib/server/db';

export const load = async ({ parent }) => {
  // Get subscription status from layout (no DB query for auth needed!)
  const { isSubscribed } = await parent();
  
  // Only fetch generated stories from DB
  const user_generated_stories = await db
    .selectFrom('generated_story')
    .selectAll()
    .where('dialect', '=', 'levantine')
    .orderBy('created_at', 'desc')
    .execute();

  return {
    hasActiveSubscription: isSubscribed,  // Use from layout!
    user_generated_stories
  }
}; 