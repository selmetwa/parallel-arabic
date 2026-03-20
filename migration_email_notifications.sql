ALTER TABLE public.user
ADD COLUMN email_notifications_enabled boolean NOT NULL DEFAULT true;
