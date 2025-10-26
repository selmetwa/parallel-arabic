import { supabase } from '$lib/supabaseClient';

export const getUserHasActiveSubscription = async (userId: string | null) => {
  // Fast path for no user
  if (!userId) {
    return false;
  }

  // Only fetch the fields we need instead of selectAll()
  const { data: user, error } = await supabase
    .from('user')
    .select('is_subscriber, subscription_end_date, email')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user subscription:', error);
  }

  if (!user) {
    return false;
  }

  // Check is_subscriber first (fastest - simple boolean check)
  if (user.is_subscriber) {
    return true;
  }

  // Check subscription end date last (requires date math)
  if (user.subscription_end_date) {
    const futureDate = new Date(user.subscription_end_date);
    const today = new Date();
    if (today < futureDate) {
      return true;
    }
  }

  return false;
};