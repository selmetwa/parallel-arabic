# Plan: Weekly XP Leaderboard

## Goal
Show the top 10 users by XP earned in the current week. Creates friendly competition and social pressure to come back and practice. Resets every Monday so it stays competitive and gives everyone a fresh shot.

---

## User Experience

- Leaderboard visible on the homepage and/or a dedicated `/leaderboard` page
- Shows top 10 users for the current week
- Each row: rank, display name (or anonymized), dialect flag/badge, weekly XP
- Logged-in user's own rank is shown even if they're not in the top 10 ("You're ranked #47 this week")
- Resets every Monday at midnight UTC (aligns with existing `week_start_date` logic)
- Users who haven't earned XP this week are excluded

---

## Privacy

- Display name shown by default
- User can opt out in profile settings → shown as "Anonymous Learner" with a generic avatar
- No full names, emails, or personal info exposed

---

## DB Changes

### `user` table — add columns:
```sql
xp_this_week           INTEGER   DEFAULT 0    -- XP earned in current week (reset Monday)
leaderboard_opt_out    BOOLEAN   DEFAULT false -- User can hide their name
```

`xp_this_week` resets on Monday alongside the existing weekly stats reset logic.

### Award XP logic update
Every time XP is awarded via `/api/award-xp`, also increment `xp_this_week` for that user.

---

## API

- `GET /api/leaderboard/weekly`
  - Returns top 10 users ordered by `xp_this_week DESC`
  - If the requesting user is not in top 10, also returns their rank and XP
  - Excludes users with `leaderboard_opt_out = true` from ranking (they still earn XP, just hidden)
  - Response: `{ top10: [...], currentUser: { rank, xp_this_week } | null }`

- Weekly reset is handled by the existing Monday cron or a new step added to it:
  - Set `xp_this_week = 0` for all users
  - Optionally snapshot last week's top 3 before resetting (for future "Hall of Fame" feature)

---

## Routes & Components

- `Leaderboard.svelte` — table component showing rank, name, XP
  - Highlight the current user's row if they appear
  - Show "Your rank: #X" footer if not in top 10
  - "This week resets in: [countdown]" label

- `/leaderboard` — dedicated page (optional, can start as homepage widget)

---

## Homepage Integration

- Show a condensed top-5 card on the homepage with a "See full leaderboard →" link
- Placed below the daily challenge / word of the day section

---

## XP This Week Reset Flow

Current flow: weekly stats reset Monday via `week_start_date` check on the `user` table.
Add `xp_this_week = 0` to that same reset so it stays in sync.

---

## Edge Cases

- Tie in XP → rank by who reached that XP total first (use a `xp_this_week_updated_at` timestamp, or just accept ties showing same rank)
- New user with 0 XP → not shown on leaderboard
- All users opt out → show "Be the first on the leaderboard this week!" empty state

---

## Out of Scope

- Per-dialect leaderboards
- All-time leaderboard (total XP already exists, can add later)
- Friend-only leaderboards
- Rewards for top finishers (can add badges/XP bonus in v2)
- Historical leaderboard snapshots visible to users
