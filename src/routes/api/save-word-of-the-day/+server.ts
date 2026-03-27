import { v4 as uuidv4 } from 'uuid';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { awardXp } from '$lib/helpers/award-xp';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ message: 'You must have an account to do that' }, { status: 401 });
  }

  const userId = user.id;
  const { arabic, english, transliteration } = await request.json();

  if (!arabic || !english) {
    return json({ message: 'Missing word data' }, { status: 400 });
  }

  // Check if already saved today (via daily activity flag)
  const todayDate = new Date();
  const activityDate = Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate());

  const { data: existingActivity } = await supabase
    .from('user_daily_activity')
    .select('id, word_of_day_saved')
    .eq('user_id', userId)
    .eq('activity_date', activityDate)
    .maybeSingle();

  if (existingActivity?.word_of_day_saved) {
    return json({ message: 'Already saved today' });
  }

  // Check if this word already exists in saved_word
  const { data: wordExists } = await supabase
    .from('saved_word')
    .select('id')
    .eq('arabic_word', arabic)
    .eq('user_id', userId)
    .maybeSingle();

  const now = Date.now();

  if (!wordExists) {
    // word_of_the_day.id is not a row in `word`; FK `fk_saved_word_word_id` requires null or a real word.id
    const { error: insertError } = await supabase
      .from('saved_word')
      .insert([{
        id: uuidv4(),
        user_id: userId,
        word_id: null,
        arabic_word: arabic,
        english_word: english,
        transliterated_word: transliteration ?? '',
        dialect: 'egyptian-arabic',
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0,
        next_review_date: null,
        last_review_date: null,
        is_learning: true,
        mastery_level: 0,
        created_at: now
      }]);

    if (insertError) {
      console.error('Error saving word of the day:', insertError);
      return json({ message: 'Something went wrong' }, { status: 500 });
    }
  }

  // Mark word_of_day_saved in daily activity (upsert)
  const activityId = `${userId}-${activityDate}`;
  if (existingActivity) {
    await supabase
      .from('user_daily_activity')
      .update({ word_of_day_saved: true, updated_at: now })
      .eq('id', existingActivity.id);
  } else {
    await supabase
      .from('user_daily_activity')
      .insert({
        id: activityId,
        user_id: userId,
        activity_date: activityDate,
        word_of_day_saved: true,
        created_at: now,
        updated_at: now
      });
  }

  // Award XP (non-blocking)
  awardXp(userId, 'word_of_day_save').catch(err => {
    console.error('Error awarding XP for word of the day:', err);
  });

  return json({ message: 'Saved', xpAwarded: 3 });
};
