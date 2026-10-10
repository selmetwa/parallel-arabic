# Retention: streaks that count games, a daily game challenge, freezes, local-time reminders

Decided with the user (2026-10-10): no weekly leagues yet (21 weekly XP players), Vercel Hobby (daily crons only), freezes earned every 7 streak days (max 2), missed game words added to review automatically. Push notifications are out of scope (they need a new app build).

1. **Games count toward the streak.** `/api/award-xp` touches the streak (`touchStreak`) on the first XP of a day.
2. **Streak days follow the learner's time zone.** `user.timezone` is sent from the browser; `src/lib/helpers/streak.ts` computes local days, freezes and badges (pure, tested). `last_activity_date` now stores the actual time.
3. **Streak freezes and badges.** A freeze is earned at every 7th streak day (max 2) and used up automatically for a missed day. Badges at 7, 30 and 100 days come from `longest_streak`.
4. **Reminders at local evening on Hobby.** `send-streak-reminders` runs four times a day (00/06/12/18 UTC, four daily crons). Each run emails people whose local time is 17:00–23:00, whose streak is at risk today, and who weren't emailed in the last 12 hours.
5. **Missed words go to review.** Word Scramble, Speed Round and Listen & Spell save missed words for signed-in players.
6. **Daily game challenge** at `/learn/game/today`: Daily Root plus a round of the game of the day (Dialect Match, Letter Hunt or Verb Blitz, rotating). Free for everyone; signed-in players get bonus XP once a day (`daily_challenge`, type `game`). A Today card on the home page and the games hub.
7. **Sharing.** Game pages use their screenshot as the link preview image; Speed Round results share a "beat my score" link (`?beat=`).

SQL: `docs/sql/2026-10-10-retention.sql` (run before deploying).
