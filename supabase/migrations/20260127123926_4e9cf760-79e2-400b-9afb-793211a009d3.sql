-- Schedule the subscription reminder to run daily at 9 AM UTC
SELECT cron.schedule(
  'subscription-reminder-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://fmljyldunjdxpbqetdlu.supabase.co/functions/v1/subscription-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbGp5bGR1bmpkeHBicWV0ZGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjY1NzcsImV4cCI6MjA4NDUwMjU3N30.tR52NXTM4Anei76LeGw51zjsxmkWgN3NQ2lWBLrUP2Q"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);