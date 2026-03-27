# Plan: "It's Been a While" Re-engagement Email

## Goal
Automatically email users who have been inactive for 3 days. The email should feel personal — referencing their streak loss and saved word count — to pull them back into their learning routine.

---

## Trigger Logic

- A cron job runs daily (similar to the existing streak reminder cron)
- Query users where:
  - `last_activity_date` is exactly 3 days ago (not 4+, to avoid spamming lapsed users)
  - `total_saved_words > 0` (so the email has something meaningful to reference)
  - User has not already received a re-engagement email in the last 7 days (see DB changes)
- For each matched user, send one re-engagement email

---

## Email Content

**Subject**: "Your Arabic words miss you 👋"

**Body**:
> Hey [name],
>
> It's been 3 days since you last practiced. Your streak ended, but your **[X] saved words** are ready and waiting for a review.
>
> [CTA Button: Resume Practice]
>
> Even 5 minutes today will rebuild your momentum.
>
> — The Parallel Arabic team

Personalization tokens:
- `[name]` — user's display name or email prefix
- `[X]` — `total_saved_words` from the `user` table

---

## DB Changes

### `user` table — add column:
```sql
last_reengagement_email_sent_at   TIMESTAMPTZ   DEFAULT null
```

This prevents sending the email more than once per week to the same user.

---

## API / Cron Changes

- New cron: `POST /api/cron/send-reengagement-emails`
  - Scheduled: daily, runs at 10:00 AM UTC
  - Queries eligible users (3 days inactive, not emailed recently)
  - Sends email via existing email provider
  - Updates `last_reengagement_email_sent_at` for each sent email

---

## Email Provider Integration

- Use the same email provider/template system as the existing streak reminder emails
- Create a new email template: `reengagement`

---

## Edge Cases

- User has 0 saved words → skip or send generic "come back and explore" variant
- User comes back before email sends → they won't match the query (last_activity_date won't be 3 days ago), no email sent
- User unsubscribes → respect existing email preference flags (add `email_reengagement_opt_in` if needed)

---

## Out of Scope

- Dynamic difficulty-based recommendations in the email (v1 just links to /review)
- A/B testing subject lines
- In-app notifications (separate feature)
