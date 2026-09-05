import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sendOnboardingNudgeEmail } from '$lib/server/email';

const DAY_MS = 24 * 60 * 60 * 1000;

function getCtaUrl(proficiencyLevel: string | null, targetDialect: string | null): string {
  if (proficiencyLevel === 'A1') return '/alphabet';
  return `/lessons/structured/${targetDialect ?? 'egyptian-arabic'}`;
}

export const GET: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = Date.now();

    const windows: { day: 1 | 3; gte: number; lt: number }[] = [
      { day: 1, gte: now - 2 * DAY_MS, lt: now - 1 * DAY_MS },
      { day: 3, gte: now - 4 * DAY_MS, lt: now - 3 * DAY_MS }
    ];

    const BATCH_SIZE = 50;
    let emailsSent = 0;

    for (const w of windows) {
      const { data: users, error: fetchError } = await supabase
        .from('user')
        .select('id, email, target_dialect, proficiency_level')
        .eq('onboarding_completed', true)
        .is('last_activity_date', null)
        .eq('email_notifications_enabled', true)
        .not('email', 'is', null)
        .gte('onboarding_completed_at', w.gte)
        .lt('onboarding_completed_at', w.lt);

      if (fetchError) {
        console.error(`Error fetching users for day-${w.day} onboarding nudge:`, fetchError);
        continue;
      }

      if (!users || users.length === 0) continue;

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (user) => {
            try {
              const ctaUrl = getCtaUrl(user.proficiency_level, user.target_dialect);
              await sendOnboardingNudgeEmail(user.email, user.id, w.day, ctaUrl);
              emailsSent++;
            } catch (err) {
              console.error(`Failed to send day-${w.day} onboarding nudge to user ${user.id}:`, err);
            }
          })
        );
      }
    }

    return json({ success: true, message: 'Onboarding nudge emails processed', emailsSent });
  } catch (error) {
    console.error('Error in onboarding-nudge cron job:', error);
    return json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
