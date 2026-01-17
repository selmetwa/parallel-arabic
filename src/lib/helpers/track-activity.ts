import { supabase } from '$lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get the start of day timestamp (midnight UTC)
 */
function getStartOfDay(): number {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return utcDate.getTime();
}

/**
 * Get the start of week timestamp (Monday midnight UTC)
 */
function getStartOfWeek(): number {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = utcDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
  utcDate.setUTCDate(utcDate.getUTCDate() - daysToMonday);
  return utcDate.getTime();
}

/**
 * Calculate streak based on last activity date
 */
function calculateStreak(lastActivityDate: number | null, currentStreak: number): number {
  if (!lastActivityDate) return 1;
  
  const today = getStartOfDay();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const lastActivityDay = Math.floor(lastActivityDate / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
  
  if (lastActivityDay === today) {
    // Activity today - maintain streak
    return currentStreak;
  } else if (lastActivityDay === yesterday) {
    // Activity yesterday - increment streak
    return currentStreak + 1;
  } else {
    // Gap in activity - reset to 1
    return 1;
  }
}

export type ActivityType = 'review' | 'sentence' | 'story' | 'lesson' | 'saved_word' | 'short';

/**
 * Track user activity and update daily/weekly/overall stats and streaks
 */
export async function trackActivity(
  userId: string,
  activityType: ActivityType,
  count: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = Date.now();
    const today = getStartOfDay();
    const weekStart = getStartOfWeek();

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('current_streak, longest_streak, last_activity_date, week_start_date')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return { success: false, error: 'User not found' };
    }

    // Calculate new streak
    const newStreak = calculateStreak(user.last_activity_date, user.current_streak || 0);
    const newLongestStreak = Math.max(user.longest_streak || 0, newStreak);

    // Check if we're in a new week
    const isNewWeek = !user.week_start_date || user.week_start_date < weekStart;

    // Upsert daily activity
    const activityId = `${userId}-${today}`;
    const { error: activityError } = await supabase
      .from('user_daily_activity')
      .upsert({
        id: activityId,
        user_id: userId,
        activity_date: today,
        reviews_count: activityType === 'review' ? count : 0,
        sentences_viewed: activityType === 'sentence' ? count : 0,
        stories_viewed: activityType === 'story' ? count : 0,
        lessons_viewed: activityType === 'lesson' ? count : 0,
        saved_words_count: activityType === 'saved_word' ? count : 0,
        shorts_viewed: activityType === 'short' ? count : 0,
        created_at: now,
        updated_at: now
      }, {
        onConflict: 'user_id,activity_date',
        ignoreDuplicates: false
      });

    if (activityError) {
      console.error('Error upserting daily activity:', activityError);
      // Try to increment existing record instead
      const updateField = {
        review: 'reviews_count',
        sentence: 'sentences_viewed',
        story: 'stories_viewed',
        lesson: 'lessons_viewed',
        saved_word: 'saved_words_count',
        short: 'shorts_viewed'
      }[activityType];

      const { error: incrementError } = await supabase.rpc('increment_daily_activity', {
        p_user_id: userId,
        p_activity_date: today,
        p_field: updateField,
        p_increment: count
      });

      if (incrementError) {
        // Fallback: manual update
        const { data: existing } = await supabase
          .from('user_daily_activity')
          .select('*')
          .eq('user_id', userId)
          .eq('activity_date', today)
          .single();

        if (existing) {
          const updateData: any = {
            updated_at: now
          };
          updateData[updateField] = (existing[updateField] || 0) + count;

          await supabase
            .from('user_daily_activity')
            .update(updateData)
            .eq('id', existing.id);
        }
      }
    }

    // Field mappings
    const totalField = activityType === 'review' ? 'total_reviews' 
      : activityType === 'saved_word' ? 'total_saved_words'
      : activityType === 'short' ? 'total_shorts_viewed'
      : `total_${activityType}s_viewed`;

    // Update user stats
    const updateData: any = {
      last_activity_date: today,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      [totalField]: (user[totalField] || 0) + count
    };

    // Handle weekly stats
    if (isNewWeek) {
      // Reset weekly stats for new week
      updateData.week_start_date = weekStart;
      updateData.reviews_this_week = activityType === 'review' ? count : 0;
      updateData.sentences_viewed_this_week = activityType === 'sentence' ? count : 0;
      updateData.stories_viewed_this_week = activityType === 'story' ? count : 0;
      updateData.lessons_viewed_this_week = activityType === 'lesson' ? count : 0;
      updateData.saved_words_this_week = activityType === 'saved_word' ? count : 0;
      updateData.shorts_viewed_this_week = activityType === 'short' ? count : 0;
    } else {
      // Increment weekly stats
      const weekField = {
        review: 'reviews_this_week',
        sentence: 'sentences_viewed_this_week',
        story: 'stories_viewed_this_week',
        lesson: 'lessons_viewed_this_week',
        saved_word: 'saved_words_this_week',
        short: 'shorts_viewed_this_week'
      }[activityType];

      updateData[weekField] = (user[weekField] || 0) + count;
    }

    const { error: updateError } = await supabase
      .from('user')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user stats:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking activity:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Simplified version that uses direct SQL updates for better reliability
 */
export async function trackActivitySimple(
  userId: string,
  activityType: ActivityType,
  count: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = Date.now();
    const today = getStartOfDay();
    const weekStart = getStartOfWeek();

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('current_streak, longest_streak, last_activity_date, week_start_date, total_reviews, total_sentences_viewed, total_stories_viewed, total_lessons_viewed, total_saved_words, total_shorts_viewed, reviews_this_week, sentences_viewed_this_week, stories_viewed_this_week, lessons_viewed_this_week, saved_words_this_week, shorts_viewed_this_week')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return { success: false, error: 'User not found' };
    }

    // Calculate new streak
    const newStreak = calculateStreak(user.last_activity_date, user.current_streak || 0);
    const newLongestStreak = Math.max(user.longest_streak || 0, newStreak);

    // Check if we're in a new week
    const isNewWeek = !user.week_start_date || user.week_start_date < weekStart;

    // Field mappings
    const fieldMap = {
      review: { daily: 'reviews_count', total: 'total_reviews', weekly: 'reviews_this_week' },
      sentence: { daily: 'sentences_viewed', total: 'total_sentences_viewed', weekly: 'sentences_viewed_this_week' },
      story: { daily: 'stories_viewed', total: 'total_stories_viewed', weekly: 'stories_viewed_this_week' },
      lesson: { daily: 'lessons_viewed', total: 'total_lessons_viewed', weekly: 'lessons_viewed_this_week' },
      saved_word: { daily: 'saved_words_count', total: 'total_saved_words', weekly: 'saved_words_this_week' },
      short: { daily: 'shorts_viewed', total: 'total_shorts_viewed', weekly: 'shorts_viewed_this_week' }
    };

    const fields = fieldMap[activityType];

    // Upsert daily activity - use upsert with conflict resolution
    const activityId = `${userId}-${today}`;
    const { data: existingActivity } = await supabase
      .from('user_daily_activity')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .maybeSingle();

    if (existingActivity) {
      // Update existing - increment the field
      const currentValue = existingActivity[fields.daily] || 0;
      const updateData: any = {
        [fields.daily]: currentValue + count,
        updated_at: now
      };

      const { error: updateError } = await supabase
        .from('user_daily_activity')
        .update(updateData)
        .eq('id', existingActivity.id);

      if (updateError) {
        console.error('Error updating daily activity:', updateError);
      }
    } else {
      // Insert new
      const insertData: any = {
        id: activityId,
        user_id: userId,
        activity_date: today,
        reviews_count: 0,
        sentences_viewed: 0,
        stories_viewed: 0,
        lessons_viewed: 0,
        saved_words_count: 0,
        shorts_viewed: 0,
        created_at: now,
        updated_at: now
      };
      insertData[fields.daily] = count;

      const { error: insertError } = await supabase
        .from('user_daily_activity')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting daily activity:', insertError);
        // If insert fails due to race condition, try update instead
        const { data: retryActivity } = await supabase
          .from('user_daily_activity')
          .select('*')
          .eq('user_id', userId)
          .eq('activity_date', today)
          .maybeSingle();

        if (retryActivity) {
          const currentValue = retryActivity[fields.daily] || 0;
          await supabase
            .from('user_daily_activity')
            .update({
              [fields.daily]: currentValue + count,
              updated_at: now
            })
            .eq('id', retryActivity.id);
        }
      }
    }

    // Update user stats
    const updateData: any = {
      last_activity_date: today,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      [fields.total]: (user[fields.total] || 0) + count
    };

    if (isNewWeek) {
      // Reset weekly stats for new week
      updateData.week_start_date = weekStart;
      updateData.reviews_this_week = activityType === 'review' ? count : 0;
      updateData.sentences_viewed_this_week = activityType === 'sentence' ? count : 0;
      updateData.stories_viewed_this_week = activityType === 'story' ? count : 0;
      updateData.lessons_viewed_this_week = activityType === 'lesson' ? count : 0;
      updateData.saved_words_this_week = activityType === 'saved_word' ? count : 0;
      updateData.shorts_viewed_this_week = activityType === 'short' ? count : 0;
    } else {
      // Increment weekly stats
      updateData[fields.weekly] = (user[fields.weekly] || 0) + count;
    }

    const { error: updateError } = await supabase
      .from('user')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user stats:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking activity:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

