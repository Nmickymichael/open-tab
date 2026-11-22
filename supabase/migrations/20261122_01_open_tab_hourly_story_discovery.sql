-- Refresh international editorial story leads every hour (Africa/Nairobi coverage).
-- This discovers and queues source leads; it does not auto-publish unverified articles.
select cron.alter_job(3, schedule => '0 * * * *');
