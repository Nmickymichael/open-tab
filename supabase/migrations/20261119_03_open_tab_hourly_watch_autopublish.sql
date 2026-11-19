-- OPEN TAB WATCH hourly trend spotlight pipeline.
create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;

create index if not exists videos_watch_youtube_id_idx
  on public.videos (youtube_id) where is_watch_review = true;

select vault.create_secret(
  'REPLACE_WITH_THE_SAME_RANDOM_SECRET_SET_IN_EDGE_FUNCTIONS',
  'open_tab_cron_secret',
  'Shared secret used only by the OPEN TAB WATCH hourly Cron invocation'
);

select cron.schedule(
  'open-tab-hourly-watch-autopublish',
  '0 * * * *',
  $job$
    select net.http_post(
      url := 'https://pescptzxxgtkzbneedda.supabase.co/functions/v1/open-tab-hourly-watch',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-open-tab-cron-secret',
        (select decrypted_secret from vault.decrypted_secrets where name='open_tab_cron_secret')
      ),
      body := jsonb_build_object('source','supabase-cron')
    );
  $job$
);

select cron.alter_job(
  job_id := (select jobid from cron.job where jobname='open-tab-hourly-watch-autopublish'),
  active := false
);
