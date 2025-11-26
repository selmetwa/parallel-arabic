import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

/**
 * Cron job to reset weekly stats for users whose week has changed
 * Should be run daily (e.g., at midnight UTC)
 * 
 * Vercel cron jobs will call this endpoint with CRON_SECRET in Authorization header
 */
export const GET: RequestHandler = async ({ request }) => {
  // Vercel adds CRON_SECRET to Authorization header for cron job invocations
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentDate = new Date();
    const utcDate = new Date(Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate()
    ));
    const dayOfWeek = utcDate.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    utcDate.setUTCDate(utcDate.getUTCDate() - daysToMonday);
    const weekStart = utcDate.getTime();

    // Find all users whose week_start_date is null or less than current week start
    const { data: users, error: fetchError } = await supabase
      .from('user')
      .select('id, week_start_date')
      .or(`week_start_date.is.null,week_start_date.lt.${weekStart}`);

    if (fetchError) {
      console.error('Error fetching users for weekly reset:', fetchError);
      return json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return json({ 
        success: true, 
        message: 'No users need weekly reset',
        resetCount: 0 
      });
    }

    // Reset weekly stats for users whose week has changed
    const { error: updateError } = await supabase
      .from('user')
      .update({
        reviews_this_week: 0,
        sentences_viewed_this_week: 0,
        stories_viewed_this_week: 0,
        lessons_viewed_this_week: 0,
        saved_words_this_week: 0,
        week_start_date: weekStart
      })
      .or(`week_start_date.is.null,week_start_date.lt.${weekStart}`);

    if (updateError) {
      console.error('Error resetting weekly stats:', updateError);
      return json({ error: 'Failed to reset weekly stats' }, { status: 500 });
    }

    return json({ 
      success: true, 
      message: `Weekly stats reset for ${users.length} user(s)`,
      resetCount: users.length,
      weekStart 
    });
  } catch (error) {
    console.error('Error in weekly reset cron job:', error);
    return json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

/**
 * POST endpoint for manual testing/debugging
 */
export const POST: RequestHandler = async ({ request }) => {
  // Allow manual testing with CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Call the GET handler logic
  return GET({ request } as any);
};

