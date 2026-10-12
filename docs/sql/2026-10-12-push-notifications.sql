-- Push notifications for the iOS app. Run before deploying the branch.

-- 1. One row per device that has allowed notifications. A token belongs to
--    whoever last signed in on that device.
create table if not exists public.push_device (
  token text primary key,
  user_id text not null references public."user"(id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null
);
create index if not exists push_device_user_id_idx on public.push_device (user_id);

-- 2. When the last push went out, so nobody gets more than one a day.
alter table public."user" add column if not exists push_sent_at bigint;
