# Retention: daily goal, weekly recap, comeback emails

Built from the Retention and Habit Formation strategies in `docs/product-design-playbook/` (Commitment, Gamified Progress, Value Replay, Effort Moat, Deep-link).

## Context (2026-10-14)

- 72 accounts are marked as subscribers. 15 were active in the last 7 days, and **45 haven't opened the app in 30 days**.
- For signups from 35 to 120 days ago:

  | | Next day | Week 5 |
  |---|---|---|
  | Free | 6% | 0.3% |
  | Subscribers | 68% | 14% |

- Reviewing is what regulars do: 71% of people active on 10 or more days review, against 7% of people active on 1 or 2 days. But 41% of the light group saved words.
- The only reminder was the streak email, sent 19 times in 30 days. Learners without a streak heard nothing.
- No push has gone out yet: `push_device` is empty, because the App Store build with push (#214, merged Oct 12) isn't live. Email covers these reminders until it is.

## What changed

1. **Daily goal (Commitment, Gamified Progress).** On the home page, a learner picks up to three activities:

   | Activity | Amounts | Counted from |
   |---|---|---|
   | Review words | 10, 20, 30 | `word_review` |
   | Play games | 1, 2, 3 | `activity_event` `game`, logged when a round starts (`createRoundGate`) |
   | Speak out loud | 5, 10, 20 | `activity_event` `speak`, logged on each successful `/api/speech-to-text` (tutor, `/speak`, shadowing, alphabet) |
   | Talk with your tutor | 1 | `tutor_conversation` |
   | Finish a lesson | 1 | `structured_lesson_progress.completed_at` (stored in seconds) |
   | Read a story | 1 | `user_story_completion` |

   Progress is counted from midnight in the learner's own time zone. The card shows a ring, each item with a link to where it's done, and "Done for today" once everything is complete. The goal is stored in `user.daily_goal`.

2. **Weekly recap email (Value Replay, Effort Moat).** Sent Sundays at 17:00 UTC by `/api/cron/weekly-recap`.
   - **Learners active that week:** what they did (reviews, words saved, lessons, stories, games, sentences spoken, tutor chats), their streak and deck size, and their goal. One button: due words, or their unfinished lesson.
   - **Subscribers who didn't practise:** "We missed you this week", with what they've built and what their plan includes.
   - **Free learners who didn't practise:** nothing; the comeback emails cover them.

3. **Comeback emails (Value Replay, Deep-link).** Sent in the learner's evening 3 and 7 days after they were last active, from the existing evening cron. They lead with the number of due words and link to `/review`. If nothing is due, they mention the lessons and saved words and link to the unfinished lesson. App users who got a push that evening are skipped.

4. **Streak email** now includes today's goal when one is set.

## Setup before deploy

1. Run `docs/sql/2026-10-14-retention.sql` in Supabase. It adds:
   - `user.daily_goal`
   - `user.weekly_email_sent_at`
   - `user.comeback_email_sent_at`
   - the `activity_event` table

   Nothing in Stripe or App Store Connect.

## Queries

How many people set a goal, and what they pick:

```sql
select item->>'kind' kind, item->>'target' target, count(*)
from "user", jsonb_array_elements(daily_goal) item
where daily_goal is not null group by 1, 2 order by 3 desc;
```

Stickiness (DAU/MAU) and subscribers active in the last 7 days. Compare with the numbers above, two and four weeks after shipping:

```sql
with a as (select user_id, to_timestamp(activity_date/1000)::date d from user_daily_activity)
select
  (select round(avg(c), 1) from (select count(distinct user_id) c from a where d >= current_date - 30 group by d) x) avg_dau,
  (select count(distinct user_id) from a where d >= current_date - 30) mau,
  (select count(*) from "user" u where is_subscriber and exists (select 1 from a where a.user_id = u.id and a.d >= current_date - 7)) subs_active_7d;
```
