import { db } from '$lib/server/db';
import { BLESSED_EMAILS } from '$lib/constants/blessed-emails';

export const getUserHasActiveSubscription = async (userId: string | null) => {
  // Fast path for no user
  if (!userId) {
    return false;
  }

  // Only fetch the fields we need instead of selectAll()
  const user = await db
    .selectFrom('user')
    .select(['is_subscriber', 'subscription_end_date', 'email'])
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!user) {
    return false;
  }

  // Check is_subscriber first (fastest - simple boolean check)
  if (user.is_subscriber) {
    return true;
  }

  // Check blessed emails (in-memory check)
  if (BLESSED_EMAILS.includes(user.email || '')) {
    return true;
  }

  // Check subscription end date last (requires date math)
  if (user.subscription_end_date) {
    const futureDate = new Date(user.subscription_end_date * 1000);
    const today = new Date();
    if (today < futureDate) {
      return true;
    }
  }

  return false;
};