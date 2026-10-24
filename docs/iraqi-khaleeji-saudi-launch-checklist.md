# Iraqi, Khaleeji and Saudi: launch checklist

Companion to `docs/iraqi-khaleeji-saudi-plan.md`. All three dialects' content is written and committed; this lists what is still needed before the dialects can be made selectable.

## Content status (done)

| Set | Where | Notes |
|---|---|---|
| v2 structured lessons, 83 per dialect (A1–B2 plus 4 assessments) | Storage `<dialect>-v2/`, drafts in `content/lessons-v2/<dialect>/` | Uploaded |
| Game words, 8 themes × ~38 per dialect | `content/words/<dialect>/*.txt` | **Not yet in the DB.** See step 2 |
| Phrasebook, 25 phrases | `src/lib/data/phrases/<dialect>/`, source `content/phrases/<dialect>.txt` | Built with `scripts/lib/build-phrases.py` |
| Verb conjugations, 72 verbs | `src/lib/data/verb-conjugations/<dialect>/`, source `content/verbs/<dialect>.txt` | Built with `scripts/lib/build-verbs.py`. Hidden from the sitemap and prerender until selectable |
| Dialect Match forms, 27 sets | `src/lib/data/dialect-match/sets.json` | |
| Room Hunt, 9 scenarios + 39 vocab words | `src/lib/games/room-hunt/`, source `content/room-hunt/<dialect>.txt` | The NPC is written as male in every scenario. **No audio yet** |
| Tutor dialogs, 10 scenarios | `src/lib/constants/tutor-scenarios.ts` | |
| Onboarding "try it" | `src/lib/constants/onboarding-try.ts` | Iraqi traces آني and شكر |
| Landing copy, comparison contrasts, 4 new comparison pairs | `dialect-landing.ts`, `dialect-comparisons.ts` | Comparison pages publish only once both dialects are selectable |

## Steps you need to run

1. **Database migration:** run `docs/sql/2026-10-23-new-dialects.sql`. The Supabase MCP is read-only, so a session can't run it.
2. **Game words:** done 2026-10-24 (917 rows seeded).
3. **Voices:** fill in the iraqi/khaleeji/saudi voices in `src/lib/utils/voice-config.ts` and `NPC_VOICE` in `scripts/generate-room-hunt-audio.ts` (male NPC voices), then run `npm run generate:room-hunt-audio`.
4. **Speech-to-text:** chirp_3 has no `ar-IQ`, so Iraqi uses `ar-KW` (decided 2026-10-24). `ar-AE` and `ar-SA` are supported.
5. **Native-speaker review:** one reviewer per dialect for the lessons, phrases, verbs, Room Hunt and tutor dialogs. Lines flagged "needs a native check" in comments come first.
6. **Word of the Day:** `scripts/seed-word-of-the-day.ts` schedules from the last existing date and needs the same number of days for every dialect. Decide whether the new dialects should start mid-schedule (backfill rows for the existing dates) or join from the next batch. The `example_*` columns can be filled once that is decided.

## Launch PR (after review)

- `src/lib/constants/dialects.ts`: set `selectable: true` for the three dialects.
- `src/lib/data/curriculum-v2.ts`: add `iraqi`, `khaleeji` and `saudi`, each mapped to `baseCurriculumV2A1B2`.
- `src/lib/constants/phrase-seeds.ts`: add the three dialects to `PHRASE_DIALECTS`.
- `src/lib/games/themes.ts`:
  - Add them to `GAME_DIALECTS` and `DIALECT_OPTIONS`.
  - Add each theme's category for each dialect: the same slug as the file name in `content/words/<dialect>/` (for example `food_and_drink`).
  - Update the `initialDialect` comment.
  - This changes Dialect Match for every user: each round then compares seven dialects.
- `src/lib/games/verb-blitz.ts` `PRONOUNS`:
  - Iraqi: آني/aani, إنتَ/inta, إنتِ/inti, هوّ/huwwa, هيّ/hiyya, إحنا/i7na, إنتو/intu, هُمّ/humma
  - Khaleeji: أنا/ana, إنتَ/inta, إنتِ/inti, هو/huwa, هي/hiya, إحنا/i7na, إنتو/intu, هُم/hum
  - Saudi: أنا/ana, إنتَ/inta, إنتِ/inti, هوّا/huwwa, هيّا/hiyya, إحنا/i7na, إنتو/intu, هُمّا/humma
- Room Hunt `scenarios/*.ts` `npcGender`: `'m'` for all three in every scenario, which is how the lines were written.
- `src/lib/utils/seo.ts`:
  - Add the three to `DIALECTS` and `DIALECT_META`.
  - Update the prose that lists "four dialects".
- Landing routes: `src/routes/{iraqi,khaleeji,saudi}/` with `vocab/` and `write/`, copied from `levantine/`. The `DialectLanding` content already exists.
- Sitemap: `src/routes/sitemap.xml/+server.ts` hard-coded paths.
- Marketing copy that says "Egyptian, Levantine, Darija and Fusha": `features.ts`, `game-features.ts`, `tutor-faqs.ts`, `paywall/+page.svelte`, `about/+page.svelte`.
- Tests: add the three dialects to `src/lib/constants/games.test.ts` once they are in `GAME_DIALECTS`.
