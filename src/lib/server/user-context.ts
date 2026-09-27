import { checkUserSubscription } from '$lib/helpers/subscription';

interface ContextUser {
  email?: string | null;
  is_subscriber?: boolean | null;
  subscription_end_date?: string | number | Date | null;
  has_used_trial?: boolean | null;
  target_dialect?: string | null;
  proficiency_level?: string | null;
  goal_level?: string | null;
  total_xp?: number | null;
  current_level?: number | null;
}

/**
 * Per-user fields exposed to every page. Shared by the root layout's server
 * load and /api/me, which prerendered pages use to fill in the real values
 * (their layout data is built once, anonymously, at build time).
 */
export function getUserContext(user: ContextUser) {
  const isSubscribed = checkUserSubscription(user);

  return {
    isSubscribed,
    // Card-up-front trial is offered once per account, and only to users who
    // aren't already subscribed. Consumers must also check they're not running
    // inside the native app before showing any trial copy.
    trialEligible: !isSubscribed && !user.has_used_trial,
    targetDialect: user.target_dialect || null,
    proficiencyLevel: user.proficiency_level || null,
    goalLevel: user.goal_level || null,
    userXp: user.total_xp ?? 0,
    userLevel: user.current_level ?? 1
  };
}

export type UserContext = ReturnType<typeof getUserContext>;
