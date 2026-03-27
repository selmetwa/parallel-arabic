# Plan: Word of the Day

## Goal
Surface a daily featured Arabic word with audio and example sentences across all 4 dialects. Give users a low-friction reason to open the app every day, even when they don't have time for a full session. Includes a "Save to review" button to feed the spaced repetition loop.

Word and example sentence should be specific to the target dialect of the learner
---

## User Experience

- Displayed prominently on the homepage (top of feed or sticky card)
- Shows one word per day — same word for all users
- Card includes:
  - The word in Arabic script + transliteration
  - English translation
  - The word spoken aloud (audio button)
  - 1 example sentence per dialect (Egyptian, Levantine, Moroccan, Fusha)
  - "Save to Review" button — adds the word to the user's review list
- Rotates every 24 hours at midnight UTC
- Visiting users (not logged in) see the card but "Save" prompts login

---

## Word Selection Strategy

Two options (choose one for v1):

**Option A — Curated list (recommended for v1)**
Maintain a static list of ~365 high-value words in the DB. Admin selects/imports them once. System picks based on `day_of_year % total_words`. No AI cost, consistent, predictable.

**Option B — AI generated**
Generate a new word + sentences each day via cron. More variety but ongoing AI cost and risk of quality issues.

Start with Option A.

---

## DB Changes

### New table: `word_of_the_day`
```sql
CREATE TABLE word_of_the_day (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arabic              TEXT NOT NULL,          -- Arabic script
  transliteration     TEXT NOT NULL,          -- e.g. "ahlan"
  english             TEXT NOT NULL,          -- English translation
  example_egyptian    TEXT,                   -- Example sentence
  example_levantine   TEXT,
  example_darija      TEXT,
  example_fusha       TEXT,
  audio_url           TEXT,                   -- Pre-generated TTS or uploaded file
  display_date        DATE UNIQUE NOT NULL,   -- The date this word is featured
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

Using `display_date` (rather than index rotation) makes it easy to schedule and override specific days.

### `user_daily_activity` table — add column:
```sql
word_of_day_saved   BOOLEAN   DEFAULT false
```

Tracks whether the user saved the word of the day (for stats/achievements).

---

## Routes & Components

- `WordOfTheDay.svelte` — homepage card component
  - Fetches today's word via `GET /api/word-of-the-day`
  - Shows audio player, dialect sentences, save button
  - Handles "already saved" state

- `GET /api/word-of-the-day` — returns today's entry from `word_of_the_day` where `display_date = today`

- `POST /api/save-word-of-the-day` — saves word to user's review list, updates `word_of_day_saved` in daily activity, awards XP

---

## Audio

- Pre-generate TTS audio for each word at import time using the existing `/api/text-to-speech` endpoint
- Store audio files in Supabase storage, save URL in `audio_url`
- Don't generate on-demand (avoids latency and cost on homepage load)

---

## Admin Seeding

- Build a simple admin panel entry (or a seed script) to bulk-import words into `word_of_the_day` with pre-assigned dates
- Start with 30–60 words; expand over time
- Use our word table? Theres 20k words there already, plenty to cycle through

---

## XP Award

- Saving the word of the day: **+3 XP** (small reward, not farmable — one word per day)

---

## Edge Cases

- No word scheduled for today → hide the card silently, log a warning
- User already saved the word → show "Saved ✓" state, no duplicate in review list
- Guest user clicks Save → redirect to login/signup

---

## Out of Scope

- Personalized word selection per user (same word for everyone in v1)
- Weekly themed word sets
- Word of the day history/archive page
- Push notifications for word of the day
