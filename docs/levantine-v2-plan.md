# Move Levantine and MSA structured lessons to v2 (A1–B2)

## Context
Egyptian structured lessons run on v2: a CEFR curriculum, heavy-practice lessons, `LessonPlayerV2` and end-of-level assessments. Levantine is still on the legacy `curriculum.ts` and `LessonPlayer`. The goal is to give Levantine the same **structure** with no Egyptian-specific content.

The v2 engine is already dialect-agnostic, so this is mostly configuration and content generation, not new code:
- `curriculum-base-v2.ts` holds a region-neutral A1–B2 curriculum. It has the same 4 levels × 20 topics as Egyptian A1–B2, with Egypt-specific units replaced. For example, "A Visit to Egypt" becomes "A Visit to the Country" and "The Ancient Egyptians" becomes "History and Heritage".
- `dialect-rules-v2.ts` already has a Levantine prompt block (Shami: هلّق, شو, b- prefix, رح future, ما negation).
- The following all take a `dialect` parameter: the schema, assembler, player, tutor step (which already lists `levantine`), `/api/lessons-v2/[id]?dialect=`, and the generate and assessment endpoints.

**Decided:** A1–B2 only, reusing the base curriculum. C1/C2 are left for later. Egypt's C1/C2 units are Egypt-specific, so they would have to be written fresh for Levantine rather than adapted.

## Steps

0. **Save this plan into the repo** as `docs/levantine-v2-plan.md`. User preference: plans go under `docs/`.

1. **Review the base curriculum for Egypt leakage.** File: `src/lib/data/curriculum-base-v2.ts`. It already looks neutral. Confirm that no titles or descriptions name Egypt-specific things. Watch for the Egyptian A1 question/answer words (`eh, fenak, imta`, `hashoof, gayiz`), which the base already swaps for English glosses. Fix any Egyptian remnant in place, since this file is shared by every future dialect.

2. **Strengthen the Levantine prompt rules if needed.** File: `src/lib/data/dialect-rules-v2.ts`. Compare the `levantine` block against the `egyptian-arabic` one for the same *kinds* of guidance (phonology, core lexicon, verb prefixes, negation, word order). Add only missing categories. Levantine-specific examples are fine to add; Egyptian examples are not.

3. **Register Levantine on an undeployed branch.** File: `src/lib/data/curriculum-v2.ts`. Add `levantine: baseCurriculumV2A1B2` to `curriculumV2`. Update the doc comment that says only Egyptian is registered. Do not merge until step 5 is done: registration switches `/lessons/structured/levantine` to v2 immediately, and the page is empty until lessons exist in storage.

4. **Generate one pilot lesson and review it.** Run the app locally on the branch, then run `npm run generate:lessons -- --dialect=levantine --only=base-a1-u02` (Greetings). Check for:
   - Real Levantine Arabic, with no Masri forms (دلوقتي, إيه, عايز, هـ future) and no MSA.
   - At least 8 recurrences per word, `wordAlignments` on every sentence, and a tutor scenario set in a Levantine context.

   If the dialect is off, iterate on the step 2 rules and regenerate before going further.

5. **Batch-generate the remaining lessons, then the assessments.**
   - `npm run generate:lessons -- --dialect=levantine --levels=A1,A2,B1,B2`. Existing lessons are skipped, and failed runs can be re-run safely.
   - `npm run generate:assessments -- --dialect=levantine --levels=A1,A2,B1,B2`. Each assessment needs that level's lessons, so run this after the lessons.
   - Output lands in `structured_lesson/levantine-v2/*.json`. Spot-check one lesson per level.

6. **Update docs.** Edit `docs/lessons-v2-revamp-plan.md`:
   - The Status section: Levantine registered (A1–B2).
   - Follow-ups: drop Levantine, keep Darija/Fusha and Levantine C1/C2.

7. **Merge and deploy**, once `levantine-v2/` has all 80 topics.

## Existing Levantine progress (no migration)
Levantine has 322 legacy progress rows across 174 users. The legacy topic IDs (`m-v2-*`) don't map to the v2 IDs (`base-*`), so those users start v2 fresh. Their legacy rows stay in the table.

This matches what happened with Egyptian: its 401 legacy rows were left orphaned when it moved to v2. The rows still feed history and XP. No code change is planned, but verify the two deep links that carry legacy IDs:
- `src/routes/history/+page.server.ts:233`
- the home page "continue lesson" link, `src/routes/+page.server.ts:356`

Opening `/lessons/structured/levantine?lessonId=m-v2-1-t1` should fall back to the curriculum view, as Egyptian already does, rather than erroring.

## Files touched
- `src/lib/data/curriculum-v2.ts`: one registry line plus the comment
- `src/lib/data/dialect-rules-v2.ts`: only if the pilot shows gaps
- `src/lib/data/curriculum-base-v2.ts`: only if Egypt leakage is found
- `docs/lessons-v2-revamp-plan.md`, `docs/levantine-v2-plan.md`
- No changes to the player, schema, assembler, API or route code.

## Verification
1. The pilot-lesson checks in step 4, plus the recurrence and alignment checks from `docs/lessons-v2-revamp-plan.md` §Verification 2–3.
2. Run `npm run dev` and open `/lessons/structured/levantine`:
   - The A1–B2 map renders with all nodes marked as existing.
   - Open a lesson and step through every step type: MCQ, typing, reorder, translate, speaking, reading, tutor chat.
   - The audio and speech-to-text behave for Levantine.
   - Completion awards XP and unlocks the next node.
3. Open one level assessment (e.g. `base-a1-u21`) and complete it.
4. Regression checks:
   - `/lessons/structured/egyptian-arabic` is unchanged.
   - `/lessons/structured/darija` and `/lessons/structured/fusha` are still on the legacy path.
   - A legacy Levantine history link opens without an error.
5. Run `npm run check` on the branch.

## Outcome (2026-09-20)

Levantine and Fusha (MSA) both shipped A1–B2: 79 lessons + 4 level assessments each, in
`structured_lesson/{dialect}-v2/`. Both were generated with the steps above; MSA followed the
same sequence right after Levantine.

Checks on the generated corpus:
- Levantine: 6,511 sentences, all with word alignments, no Egyptian/MSA forms.
- Fusha: 6,225 sentences, all with word alignments, no colloquial forms. 72 sentences (1.2%)
  came back with an undiacritized `arabicTashkeel`; left as-is.
- Each lesson reports 92–154 steps, 12–15 words, min recurrence 11+ (target was 8).

One curriculum fix: `base-b2-u01` was titled "A Visit to the Country", which the generator read
as "the countryside" in both dialects. Renamed to "A Visit to an Arabic-Speaking Country" with an
explicit description, and that lesson was regenerated for both.

Still on the legacy system: Darija. C1/C2 for Levantine and Fusha are not authored.
