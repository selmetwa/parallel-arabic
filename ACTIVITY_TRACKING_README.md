# Activity Tracking Implementation

## Overview
This implementation tracks user activity including daily streaks, weekly stats, and overall statistics for:
- Reviews done
- Sentences viewed
- Stories viewed
- Lessons viewed
- Saved words

## Database Migration

Run the migration file to create the necessary tables and columns:
```sql
-- See: migration_add_activity_tracking.sql
```

This creates:
1. `user_daily_activity` table - tracks daily activity counts per user
2. Adds columns to `user` table for streaks and cached stats

## Activity Tracking Endpoints

### Automatic Tracking
- **Reviews**: Automatically tracked in `/api/review-word` endpoint
- **Saved Words**: Automatically tracked in `/api/save-word` endpoint
- **Lessons**: Automatically tracked in `/lessons/[id]/+page.server.ts`
- **Stories**: Automatically tracked in story page server load functions
- **Sentences**: Tracked via `/api/track-sentence-view` (called from SentenceBlock component)

### Manual Tracking Endpoints
- `POST /api/track-sentence-view` - Track sentence views
- `POST /api/track-story-view` - Track story views
- `POST /api/track-lesson-view` - Track lesson views

## Cron Job

### Weekly Stats Reset
**Endpoint**: `POST /api/cron/reset-weekly-stats`

**Purpose**: Resets weekly stats for users whose week has changed (runs daily)

**Setup**:
1. Set `CRON_SECRET_TOKEN` environment variable
2. Schedule to run daily at midnight UTC (or your preferred time)
3. Use a cron service (e.g., Vercel Cron, GitHub Actions, etc.)

**Example Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/reset-weekly-stats",
    "schedule": "0 0 * * *"
  }]
}
```

**Manual Testing**:
```bash
curl -X POST https://your-domain.com/api/cron/reset-weekly-stats \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

## Helper Function

### `trackActivitySimple(userId, activityType, count)`
Located in: `src/lib/helpers/track-activity.ts`

**Parameters**:
- `userId`: User ID
- `activityType`: 'review' | 'sentence' | 'story' | 'lesson' | 'saved_word'
- `count`: Number to increment (default: 1)

**What it does**:
1. Updates `user_daily_activity` table (upserts daily record)
2. Updates user streak (current_streak, longest_streak, last_activity_date)
3. Updates overall stats (total_* columns)
4. Updates weekly stats (.*_this_week columns, resets if new week)

## Data Structure

### `user_daily_activity` Table
- `id`: Primary key (format: `{userId}-{timestamp}`)
- `user_id`: Foreign key to user
- `activity_date`: Timestamp of day start (midnight UTC)
- `reviews_count`: Reviews done on this day
- `sentences_viewed`: Sentences viewed on this day
- `stories_viewed`: Stories viewed on this day
- `lessons_viewed`: Lessons viewed on this day
- `saved_words_count`: Words saved on this day

### `user` Table Additions
**Streaks**:
- `current_streak`: Current consecutive days
- `longest_streak`: Best streak ever
- `last_activity_date`: Last date with activity

**Overall Stats**:
- `total_reviews`
- `total_sentences_viewed`
- `total_stories_viewed`
- `total_lessons_viewed`
- `total_saved_words`

**Weekly Stats**:
- `reviews_this_week`
- `sentences_viewed_this_week`
- `stories_viewed_this_week`
- `lessons_viewed_this_week`
- `saved_words_this_week`
- `week_start_date`: Monday midnight UTC of current week

## Querying Stats

### Get Daily Stats
```sql
SELECT * FROM user_daily_activity
WHERE user_id = ? AND activity_date = ?
```

### Get Weekly Stats (from user table)
```sql
SELECT 
  reviews_this_week,
  sentences_viewed_this_week,
  stories_viewed_this_week,
  lessons_viewed_this_week,
  saved_words_this_week
FROM user
WHERE id = ?
```

### Get Overall Stats (from user table)
```sql
SELECT 
  total_reviews,
  total_sentences_viewed,
  total_stories_viewed,
  total_lessons_viewed,
  total_saved_words,
  current_streak,
  longest_streak
FROM user
WHERE id = ?
```

### Get Weekly Stats from Daily Activity (alternative)
```sql
SELECT 
  SUM(reviews_count) as reviews_this_week,
  SUM(sentences_viewed) as sentences_viewed_this_week,
  SUM(stories_viewed) as stories_viewed_this_week,
  SUM(lessons_viewed) as lessons_viewed_this_week,
  SUM(saved_words_count) as saved_words_this_week
FROM user_daily_activity
WHERE user_id = ?
AND activity_date >= ? -- Start of week (Monday midnight UTC)
```

## Notes

- All timestamps are normalized to midnight UTC for consistent day boundaries
- Weekly stats reset automatically when a new week starts (Monday)
- Streaks are calculated based on consecutive days with activity
- Activity tracking is non-blocking (errors are logged but don't fail requests)
- The cron job should run daily to reset weekly stats for users in new weeks

