-- ============================================================================
-- ARVO Email Scheduler - Cron Job Setup
-- ============================================================================
--
-- This SQL script sets up the hourly cron job that triggers the email-scheduler
-- Edge Function. Run this in the Supabase SQL Editor or via psql.
--
-- Prerequisites:
-- 1. Edge Function 'email-scheduler' must be deployed
-- 2. RESEND_API_KEY and APP_URL secrets must be set
-- 3. Database migration 20251118000004 must be applied
--
-- ============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing cron job if it exists (useful for updates)
SELECT cron.unschedule('email-scheduler-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'email-scheduler-hourly'
);

-- Create hourly cron job for email scheduler
-- Runs every hour on the hour (0 * * * *)
SELECT cron.schedule(
  'email-scheduler-hourly',
  '0 * * * *',  -- Every hour on the hour
  $$
  SELECT net.http_post(
    url:='https://pttyfxgmmhuhzgwmwser.supabase.co/functions/v1/email-scheduler',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dHlmeGdtbWh1aHpnd213c2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NzU3NDEsImV4cCI6MjA3ODE1MTc0MX0.tSnh7gIeK8vNtZAp1nfFKMJ7JoSlQrb7xtJSyHRyWWc'
    )
  ) AS request_id;
  $$
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify cron job was created
SELECT
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'email-scheduler-hourly';

-- Check recent cron job runs
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'email-scheduler-hourly')
ORDER BY start_time DESC
LIMIT 10;

-- ============================================================================
-- Monitoring Queries
-- ============================================================================

-- View all scheduled email cron jobs
SELECT * FROM cron.job WHERE jobname LIKE '%email%';

-- View failed cron runs
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 20;

-- View email events sent in the last 24 hours
SELECT
  event_type,
  COUNT(*) as count,
  MAX(sent_at) as last_sent
FROM email_events
WHERE sent_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY last_sent DESC;

-- ============================================================================
-- Cleanup (if needed)
-- ============================================================================

-- To remove the cron job, uncomment and run:
-- SELECT cron.unschedule('email-scheduler-hourly');
