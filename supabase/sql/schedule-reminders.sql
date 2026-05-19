-- Nourish AI reminder scheduler
-- Replace the two placeholders before running this in the Supabase SQL editor.
-- This wakes the Edge Function every 5 minutes. The function itself dedupes deliveries.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'nourish-reminders-every-5-minutes',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);
