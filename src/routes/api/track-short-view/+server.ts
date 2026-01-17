import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { trackActivitySimple } from '$lib/helpers/track-activity';
import { supabase } from '$lib/supabaseClient';
import { checkUserSubscription } from '$lib/helpers/subscription';

// Free users can watch 5 shorts before hitting the paywall
const FREE_SHORTS_LIMIT = 5;

export const POST: RequestHandler = async ({ request, locals }) => {
  // @ts-expect-error - auth property exists on locals at runtime
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { count = 1 } = await request.json().catch(() => ({}));

  // Check if user is subscribed
  const isSubscribed = checkUserSubscription(user);
  
  // Get current view count
  const currentViewCount = user.total_shorts_viewed || 0;
  const newViewCount = currentViewCount + count;
  
  // Check if limit will be reached after this view
  const limitReached = !isSubscribed && newViewCount >= FREE_SHORTS_LIMIT;

  // Track short view activity (non-blocking)
  const result = await trackActivitySimple(userId, 'short', count);

  if (!result.success) {
    console.error('Error tracking short view:', result.error);
    // Don't fail the request if tracking fails
  }

  return json({ 
    success: true,
    totalViews: newViewCount,
    limitReached,
    remaining: isSubscribed ? null : Math.max(0, FREE_SHORTS_LIMIT - newViewCount)
  });
};

