# Nur voices and dialect varieties

Switch text-to-speech (and so the tutor's voice) from ElevenLabs to EESI's Nur
voices, and let learners of Levantine and Khaleeji pick their country's
variety. Everything sits behind one hardcoded flag, `NUR_ENABLED` in
`src/lib/constants/feature-flags.ts`.

## Decisions (2026-11-16)

- Varieties are an accent layer inside the existing dialects. The structured
  curriculum, games, phrasebook, verbs and their recordings stay shared.
- Levantine: Syrian (default), Lebanese, Jordanian, Palestinian.
- Khaleeji: Emirati (default), Kuwaiti, Qatari, Bahraini, Omani.
- Saudi stays Hijazi only. No Najdi, no split.
- Every voice is an EESI "Nur" voice (Nur Lebanese, Nur Egyptian Male, ...),
  one per dialect or variety. Each keeps the gender of the main ElevenLabs
  voice it replaces, except Palestinian, which only has a male Nur voice.
- Only documented EESI language codes are sent (arz, apc, ary, afb, ar). The
  API accepts any code, so Iraqi and Hijazi rely on the voice for the accent.
- Shared audio (game clips, community stories) uses the dialect's default
  variety; a learner's own variety applies to their TTS and generated text.
- Everything generated on demand uses the learner's variety: tutor (chat,
  hints, scenarios, translation), stories, sentences, words, definition
  sentences, game sentences, the four puzzle games, self-study, conjugations,
  custom lessons and tutor notes.
- Not varied: structured lessons and assessments (generated ahead of time),
  dictionary word details (cached and shared in `word_details`), and fixed
  content (phrasebook, verbs, Room Hunt, Dialect Match).
- Variety landing pages (/lebanese-arabic, ...) are part of this work.
- Speech-to-text stays on Google Chirp 3 with the dialect's locale (unchanged).

## Data

- `user.target_variety text null` (`docs/sql/2026-11-16-target-variety.sql`, run by hand).
- A null variety resolves to the dialect's default variety.
- A learner's variety only applies to their own target dialect. Browsing
  another dialect uses that dialect's default.

## Pieces

1. **Constants**: `feature-flags.ts`, `varieties.ts` (variety list, defaults,
   Nur voice ids per dialect and variety, prompt notes).
2. **TTS**: `src/lib/server/tts.ts` `synthesizeSpeech()` picks EESI or
   ElevenLabs. Used by `/api/text-to-speech`, `/api/game-audio` and story audio.
   Game audio URLs gain `v=nur` so CDN-cached ElevenLabs clips aren't mixed in.
3. **User**: `targetVariety` in the user context; `/api/user-preferences/dialect`
   and `/api/onboarding` accept `variety`.
4. **Generation**: `getDialectSystemInstruction(dialect, variety)` appends the
   variety's notes. Tutor routes, story, sentence, word and definition routes
   resolve the variety server-side from `locals.user`.
5. **UI**: onboarding map picker selects a variety per country and previews its
   voice; the dialect switcher lists varieties; a landing-page CTA carries the
   variety into onboarding (`variety-hint.ts`).
6. **Landing pages**: `/[variety=variety]` (matcher off when the flag is off),
   copy in `variety-landing.ts`, SEO meta, sitemap, links from the parent page.
7. **Static audio**: `scripts/generate-variety-audio.ts` writes the preview and
   sample-phrase clips to `static/audio/varieties/`.

## Launch steps (user)

1. Run `docs/sql/2026-11-16-target-variety.sql` in Supabase.
2. Add `EESI_API_KEY` to Vercel (production and preview).
3. `NUR_ENABLED` is `true`; set it to `false` to roll back.
