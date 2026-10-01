-- Hard paywall vs freemium A/B test (docs/paywall-ab-test-plan.md).
-- Assigned once, at the end of onboarding, to new web signups only.
-- Null means not in the experiment: existing users, native signups, and anyone
-- who signed up while PAYWALL_EXPERIMENT was off.
alter table public."user" add column if not exists paywall_variant text;
alter table public."user" add column if not exists paywall_variant_assigned_at bigint;

alter table public."user" drop constraint if exists user_paywall_variant_check;
alter table public."user" add constraint user_paywall_variant_check
  check (paywall_variant is null or paywall_variant in ('hard', 'freemium'));


-- ---------------------------------------------------------------------------
-- Analysis (read-only; run any time).
-- Trial started = has_used_trial. Paying = is_subscriber now, so someone who
-- paid and then churned counts as not paying.
-- The 14-day column only counts users past their 7-day trial; the 30-day
-- column only counts users assigned at least 30 days ago.
-- ---------------------------------------------------------------------------
-- select
--   paywall_variant,
--   count(*) as assigned,
--   round(100.0 * avg(has_used_trial::int), 1) as pct_started_trial,
--   count(*) filter (where paywall_variant_assigned_at < (extract(epoch from now() - interval '14 days') * 1000)) as assigned_14d_ago,
--   round(100.0 * avg(is_subscriber::int) filter (
--     where paywall_variant_assigned_at < (extract(epoch from now() - interval '14 days') * 1000)
--   ), 1) as pct_paying_14d,
--   count(*) filter (where paywall_variant_assigned_at < (extract(epoch from now() - interval '30 days') * 1000)) as assigned_30d_ago,
--   round(100.0 * avg(is_subscriber::int) filter (
--     where paywall_variant_assigned_at < (extract(epoch from now() - interval '30 days') * 1000)
--   ), 1) as pct_paying_30d
-- from public."user"
-- where paywall_variant is not null
-- group by paywall_variant;


-- ---------------------------------------------------------------------------
-- Ending the test.
-- 1. Set PAYWALL_EXPERIMENT to anything but 'on' in Vercel, so new signups
--    stop being assigned.
-- 2. Hard-group users stay gated until their variant is cleared. To give them
--    the free plan back:
-- update public."user" set paywall_variant = null where paywall_variant = 'hard';
-- ---------------------------------------------------------------------------
