import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sendStreakReminderEmail } from '$lib/server/email';

export const GET: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Start of yesterday UTC (midnight)
    const now = new Date();
    const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const endOfYesterday = startOfToday - 1;

    // Fetch users who were active yesterday but not yet today, with streak > 0 and notifications enabled
    const { data: users, error: fetchError } = await supabase
      .from('user')
      .select('id, email, current_streak')
      .eq('email_notifications_enabled', true)
      .gt('current_streak', 0)
      .gte('last_activity_date', startOfYesterday)
      .lte('last_activity_date', endOfYesterday)
      .not('email', 'is', null);

    if (fetchError) {
      console.error('Error fetching users for streak reminders:', fetchError);
      return json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return json({ success: true, message: 'No users need streak reminders', emailsSent: 0 });
    }

    // Batch send in groups of 50
    const BATCH_SIZE = 50;
    let emailsSent = 0;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (user) => {
          try {
            await sendStreakReminderEmail(user.email, user.current_streak, user.id);
            emailsSent++;
          } catch (err) {
            console.error(`Failed to send streak reminder to user ${user.id}:`, err);
          }
        })
      );
    }

    return json({ success: true, message: `Streak reminders sent`, emailsSent });
  } catch (error) {
    console.error('Error in send-streak-reminders cron job:', error);
    return json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
