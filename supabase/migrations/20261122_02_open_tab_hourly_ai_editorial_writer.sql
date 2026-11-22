do $$
declare existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'open-tab-ai-editorial-writer'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'open-tab-ai-editorial-writer',
    '30 * * * *',
    $job$
      select net.http_post(
        url := 'https://pescptzxxgtkzbneedda.supabase.co/functions/v1/open-tab-editorial-writer',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-open-tab-cron-secret',
          (select decrypted_secret from vault.decrypted_secrets where name = 'open_tab_cron_secret')
        ),
        body := jsonb_build_object('task', 'write'),
        timeout_milliseconds := 120000
      );
    $job$
  );
end $$;