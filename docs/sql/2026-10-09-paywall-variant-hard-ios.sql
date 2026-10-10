-- Hard paywall for every new iOS signup (docs/ios-plans-parity-plan.md, phase 2).
-- iOS users get 'hard_ios' instead of 'hard', so the web A/B test's numbers
-- (analysis query in 2026-09-30-add-paywall-variant.sql) stay web-only.
-- Run this BEFORE deploying the code: until then, saving onboarding for an
-- iOS signup fails the check constraint.
alter table public."user" drop constraint if exists user_paywall_variant_check;
alter table public."user" add constraint user_paywall_variant_check
  check (paywall_variant is null or paywall_variant in ('hard', 'freemium', 'hard_ios'));


-- ---------------------------------------------------------------------------
-- Turning the iOS paywall off: there is no env switch, so revert the code in
-- api/onboarding. To give gated iOS users the free plan back:
-- update public."user" set paywall_variant = null where paywall_variant = 'hard_ios';
-- ---------------------------------------------------------------------------
