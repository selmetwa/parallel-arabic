# Scripts

## sync-stripe-subscriptions.ts

Syncs subscription data from Stripe to the database. This script:

1. Fetches all users with `subscriber_id` from the database
2. Checks their subscription status in Stripe
3. Updates the database with correct `is_subscriber` and `subscription_end_date` values

### Usage

**Dry run (preview changes without updating):**
```bash
npm run sync:subscriptions:dry
```

**Sync all subscriptions:**
```bash
npm run sync:subscriptions
```

**Sync specific user:**
```bash
npm run sync:subscriptions -- --user-id=<userId>
```

### Environment Variables Required

- `STRIPE_SECRET` - Your Stripe secret key
- `PUBLIC_SUPABASE_URL` or `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` - Your Supabase service role key (for admin access)

### What it does

- Checks each user's subscription status in Stripe
- Compares with database values
- Updates `is_subscriber` boolean based on Stripe status
- Updates `subscription_end_date` with Stripe's `current_period_end`
- Only updates if there are differences
- Provides detailed logging of all changes

### Output

The script provides:
- Progress updates for each user
- Summary of changes (updated, skipped, errors, not found)
- Detailed change log showing old vs new values

---

## populate-words.ts

Populates the `word` table by fetching vocabulary from API endpoints and importing local common words data. This script:

1. Fetches words from API endpoints for Egyptian Arabic, Darija, and Fusha dialects
2. Imports common words from the local `common-words.ts` file
3. Inserts all words into the `word` table with proper dialect and category mapping

### Usage

**Dry run (preview without inserting):**
```bash
npm run populate:words:dry
```

**Populate all words:**
```bash
npm run populate:words
```

**Populate specific dialect only:**
```bash
npm run populate:words -- --dialect=egyptian-arabic
npm run populate:words -- --dialect=darija
npm run populate:words -- --dialect=fusha
```

### Environment Variables Required

- `PUBLIC_SUPABASE_URL` or `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` - Your Supabase service role key (for admin access)

### What it does

- Fetches words from API endpoints for each section in:
  - Egyptian Arabic (`sections.ts`)
  - Darija (`darija-sections.ts`)
  - Fusha (`fusha-sections.ts`)
- Imports common words from `common-words.ts` (for `most_common` section)
- Maps data to the `word` table schema:
  - `arabic_word` - Arabic text
  - `english_word` - English translation
  - `transliterated_word` - Transliteration (franco)
  - `dialect` - Dialect identifier
  - `category` - Section/category name
  - `audio_url` - Audio URL (if available)
  - `frequency` - Word frequency (for common words)
  - `source` - Source identifier ('api' or 'common_words')
- Uses `upsert` to avoid duplicates (based on unique constraint)
- Processes in batches to avoid overwhelming the database
- Includes rate limiting to avoid API throttling

### Output

The script provides:
- Progress updates for each section
- Word counts fetched/inserted
- Summary statistics (total words, inserted, skipped duplicates, errors)
- Detailed logging of API calls and database operations

