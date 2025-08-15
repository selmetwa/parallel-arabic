import { db } from '$lib/server/db';
import { BLESSED_EMAILS } from '$lib/constants/blessed-emails';

export const getUserHasActiveSubscription = async (userId: string) => {
  const user = await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();
  const subscriptionId = user?.subscriber_id;
  const subscriptionEndDate = user?.subscription_end_date;
  
  const futureDate = new Date(subscriptionEndDate * 1000);
  const today = new Date();

  if (subscriptionId) {
    return true
  }

  if (today < futureDate) {
    return true
  }

  if (BLESSED_EMAILS.includes(user?.email || '')) {
    return true
  }

  return false
};