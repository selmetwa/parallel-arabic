/**
 * Shared subscription utilities
 * Single source of truth for subscription checking logic
 */

// Consolidated whitelist of emails that have access regardless of subscription
export const WHITELISTED_EMAILS = [
  'anguszeng.az@gmail.com',
];

/**
 * User object type for subscription checking
 * Works with both Supabase auth user and database user objects
 */
interface SubscriptionUser {
  email?: string | null;
  is_subscriber?: boolean | null;
  subscription_end_date?: string | Date | null;
}

/**
 * Check if a user has an active subscription based on user object data
 * This is a fast, synchronous check that doesn't make any API calls
 * 
 * @param user - User object with subscription-related fields
 * @returns boolean indicating if user has active subscription
 */
export function checkUserSubscription(user: SubscriptionUser | null | undefined): boolean {
  if (!user) {
    return false;
  }

  // Check if user is whitelisted
  const isWhitelisted = user.email && WHITELISTED_EMAILS.includes(user.email.toLowerCase());
  if (isWhitelisted) {
    return true;
  }

  // Check is_subscriber boolean field
  if (user.is_subscriber) {
    return true;
  }

  // Check subscription end date
  if (user.subscription_end_date) {
    const endDate = typeof user.subscription_end_date === 'string' 
      ? new Date(user.subscription_end_date) 
      : user.subscription_end_date;
    
    if (new Date() < endDate) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an email is whitelisted
 * @param email - Email to check
 * @returns boolean indicating if email is whitelisted
 */
export function isEmailWhitelisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return WHITELISTED_EMAILS.includes(email.toLowerCase());
}


