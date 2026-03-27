# Plan: Onboarding Diagnostic Quiz

## Goal
Ask new users 5 questions at signup to determine their dialect preference and current skill level. Place them into the right starting lesson so they don't churn from content that's too easy or too hard.

---

## User Flow

1. User completes account creation (email + password)
2. Before landing on the homepage, they are redirected to `/onboarding`
3. They answer 5 questions across 2 phases:
   - **Phase 1 — Dialect Selection (1 question)**: Which dialect are they most interested in? (Egyptian, Levantine, Moroccan, Fusha, or "Not sure yet")
   - **Phase 2 — Skill Level (4 questions)**: Short comprehension/recognition questions in Arabic that adapt based on the chosen dialect. Each question is multiple choice.
4. Based on answers, the system assigns:
   - A `primary_dialect`
   - A `skill_level` (beginner / intermediate / advanced)
5. User is redirected to the homepage with a personalized lesson recommendation shown first.

---

## Question Design

### Phase 1 (Dialect)
- "Which Arabic dialect are you most interested in learning?"
  - Egyptian, Levantine, Moroccan Darija, Modern Standard Arabic (Fusha), Not sure yet

### Phase 2 (Skill — 4 questions)
Questions should test recognition of common words/phrases in the chosen dialect. Start easy, escalate.

- Q1: Recognize a greeting (مرحبا / أهلاً) — beginner check
- Q2: Identify a family word (e.g. "أخ" = brother) — beginner check
- Q3: Fill in a simple sentence with a verb — intermediate check
- Q4: Interpret a short phrase in context — intermediate/advanced check

Scoring:
- 0–1 correct → beginner
- 2–3 correct → intermediate
- 4 correct → advanced

---

## DB Changes

### `user` table — add columns:
```sql
primary_dialect      TEXT       -- 'egyptian' | 'levantine' | 'darija' | 'fusha' | null
skill_level          TEXT       -- 'beginner' | 'intermediate' | 'advanced' | null
onboarding_complete  BOOLEAN    DEFAULT false
```

No new tables needed — quiz results are ephemeral and only the outcome (dialect + level) is persisted.

---

## Routes & Components

- `/onboarding` — new page, only accessible once (redirect away if `onboarding_complete = true`)
- `OnboardingQuiz.svelte` — step-by-step quiz UI with progress indicator
- `POST /api/complete-onboarding` — saves `primary_dialect`, `skill_level`, sets `onboarding_complete = true`

---

## Homepage Integration

- If `primary_dialect` is set, filter the homepage lesson suggestions to lead with that dialect
- Show a banner: "Based on your quiz, we suggest starting here →" pointing to the appropriate structured lesson module

---

## Edge Cases

- User skips the quiz → set `onboarding_complete = true` with nulls, show default homepage
- "Not sure" dialect → show Fusha as default with a note that they can switch anytime
- Existing users → no redirect, skip quiz entirely

---

## Out of Scope

- Adaptive question branching (all users get the same 4 skill questions for simplicity)
- Re-taking the quiz (can be a future profile setting)
- Generating personalized content based on level (homepage surfacing is enough for v1)
