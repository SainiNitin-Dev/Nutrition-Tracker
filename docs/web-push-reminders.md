# Web Push Reminders

Nourish AI reminders use browser Web Push, Supabase Edge Functions, and Supabase Cron. This keeps the project free-tier friendly while still sending reminders when the app is closed.

## What Gets Sent

- Supplement reminders at each active supplement schedule time.
- Hydration nudges at 10:30, 13:30, 16:30, and 19:30 when the user is behind pace.
- Meal nudges at breakfast, lunch, snack, and dinner times when that meal has not been logged yet.

Every reminder is deduped by `NotificationDelivery`, so the scheduled job can safely run every 5 minutes without spamming the same notification.

## Setup

1. Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

2. Add these to Vercel project environment variables and Supabase Edge Function secrets:

```env
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:your-email@example.com"
```

3. Push the Prisma schema so the push tables exist:

```bash
npm run db:push
```

4. Deploy the Edge Function:

```bash
supabase functions deploy send-reminders
```

5. In Supabase SQL editor, run `supabase/sql/schedule-reminders.sql` after replacing:

- `<PROJECT_REF>` with your Supabase project ref.
- `<SUPABASE_SERVICE_ROLE_KEY>` with your service role key.

## Mobile Notes

- Android Chrome can receive Web Push after permission is granted.
- iPhone Safari requires the app to be added to the Home Screen before web push notifications work reliably.
- Users must tap `Enable push reminders` in the app because browsers do not allow notification permission to be requested silently.
