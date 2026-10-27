-- Dictionary (docs/plans/zoe-feedback.md, Phase 6). Run before deploying the
-- branch: /api/dictionary/search filters on arabic_plain, and entry pages cache
-- their details in word_details.

-- The Arabic without harakat or tatweel, and with أ إ آ as plain ا, so a
-- search for اكل finds أكل and شجع finds شجّع.
alter table public.word
	add column if not exists arabic_plain text
	generated always as (
		regexp_replace(translate(arabic_word, 'أإآ', 'ااا'), '[ًٌٍَُِّْٰـ]', '', 'g')
	) stored;

create index if not exists word_dialect_idx on public.word (dialect);

-- Grammar details for a word, filled in the first time its dictionary entry
-- is opened and reused after that.
create table if not exists public.word_details (
	word_id text primary key references public.word (id) on delete cascade,
	pos text,                         -- noun, verb, adjective, adverb, phrase…
	gender text,                      -- masculine / feminine, nouns only
	plural_arabic text,
	plural_transliteration text,
	root text,                        -- e.g. "ك ت ب"
	present_arabic text,              -- verbs: the "he does" form
	present_transliteration text,
	examples jsonb not null default '[]'::jsonb, -- [{arabic, transliteration, english}]
	created_at timestamptz not null default now()
);

-- Anyone can read; only the server (service role) writes.
alter table public.word_details enable row level security;
create policy "word_details are public" on public.word_details for select using (true);
