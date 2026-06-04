import { WHITELISTED_EMAILS as WHITELISTED_EMAILS_RAW } from '$lib/config/whitelisted-emails';

/**
 * Shared subscription utilities
 * Single source of truth for subscription checking logic
 */

// Consolidated whitelist of emails that have access regardless of subscription
const WHITELISTED_EMAILS = WHITELISTED_EMAILS_RAW.map(e => e.toLowerCase());
/**
 * User object type for subscription checking
 * Works with both Supabase auth user and database user objects
 */
interface SubscriptionUser {
  email?: string | null;
  is_subscriber?: boolean | null;
  subscription_end_date?: string | number | Date | null;
}

/**
 * Normalize a subscription_end_date value into epoch milliseconds.
 *
 * The DB stores this as a Unix timestamp in seconds (e.g. 1780026293), but the
 * field can also arrive as a Date or an ISO string depending on the source, so
 * we handle all three and disambiguate seconds vs. milliseconds by magnitude.
 *
 * @returns epoch ms, or null if the value is empty/unparseable
 */
function toEndDateMs(value: string | number | Date | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  // Numeric (or numeric string) => Unix timestamp. Values below ~1e12 are
  // seconds; anything larger is already milliseconds.
  const num = Number(value);
  if (!Number.isNaN(num)) {
    return num < 1e12 ? num * 1000 : num;
  }

  // Fall back to parsing as an ISO/date string.
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

/**
 * Check if a user has an active subscription based on user object data
 * This is a fast, synchronous check that doesn't make any API calls
 *
 * Mirrors the DB-first logic in getUserHasActiveSubscription: a subscription is
 * active only when is_subscriber is set AND the end date has not passed (a
 * missing end date is treated as active).
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

  // Must be flagged as a subscriber to be active.
  if (!user.is_subscriber) {
    return false;
  }

  // Active if there's no end date, or the end date is still in the future.
  const endDateMs = toEndDateMs(user.subscription_end_date);
  return endDateMs === null || endDateMs > Date.now();
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



