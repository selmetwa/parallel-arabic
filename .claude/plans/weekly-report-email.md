# Plan: Personalized Weekly Report Email

## Goal
Send every active user a Sunday email summarizing their week — words learned, XP earned, streak status — and recommend one lesson for the coming week. Makes users feel progress and gives them a pull back on Monday.

---

## Send Schedule

- Cron runs every Sunday at 8:00 AM UTC
- Targets users who have had **at least 1 activity** in the past 7 days (don't email totally inactive users — that's the re-engagement email's job)

---

## Email Content

**Subject**: "Your week in Arabic — [X] XP earned 🌟"

**Body sections**:

1. **This Week's Stats**
   - Reviews completed: `reviews_this_week`
   - Sentences practiced: `sentences_viewed_this_week`
   - Stories read: `stories_viewed_this_week`
   - Lessons completed: `lessons_viewed_this_week`
   - XP earned this week (derived — see DB changes)
   - Current streak

2. **Streak Status**
   - If streak is alive: "You're on a [X]-day streak — keep it going!"
   - If streak died this week: "Your streak ended this week, but you still made progress. Start fresh tomorrow."

3. **Suggested Lesson**
   - One lesson recommended based on `primary_dialect` and `skill_level` (from onboarding)
   - Fallback: most popular lesson of the week across all users
   - CTA button: "Start This Lesson →"

4. **Motivational closer**
   - Simple encouraging line, no fluff

---

## DB Changes

### `user_daily_activity` table — derive weekly XP
Weekly XP is not currently stored. Two options:
1. **Preferred**: Add `xp_earned` column to `user_daily_activity` and log it each time XP is awarded
2. **Fallback**: Calculate from activity counts × XP rates at email send time (less accurate but no schema change)

```sql
-- Option 1: add to user_daily_activity
xp_earned   INTEGER   DEFAULT 0
```

### `user` table — add column:
```sql
last_weekly_report_sent_at   TIMESTAMPTZ   DEFAULT null
weekly_report_opt_in         BOOLEAN       DEFAULT true
```

---

## API / Cron Changes

- New cron: `POST /api/cron/send-weekly-reports`
  - Scheduled: Sundays at 8:00 AM UTC
  - Queries active users (activity in last 7 days, `weekly_report_opt_in = true`)
  - Aggregates stats from `user` and `user_daily_activity`
  - Selects recommended lesson
  - Sends email via existing email provider
  - Updates `last_weekly_report_sent_at`

---

## Weekly Stats Reset Coordination

The `user` table already resets weekly stats on Monday (`week_start_date`). The cron must run **before** that reset — Sunday ensures stats are still available at send time.

---

## Email Provider Integration

- New email template: `weekly_report`
- Use same provider as streak/re-engagement emails
- Template should handle the case where some stats are 0 gracefully (e.g. "No stories this week — try one!")

---

## Edge Cases

- New user (< 7 days old) → skip first week, send from week 2 onward
- User with `weekly_report_opt_in = false` → skip
- All stats are 0 despite being "active" (edge case) → don't send

---

## Out of Scope

- Digest with multiple lesson suggestions
- Interactive email (AMP email)
- Per-dialect breakdown in the email
