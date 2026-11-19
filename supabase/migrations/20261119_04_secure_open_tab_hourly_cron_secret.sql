create or replace function public.verify_open_tab_cron_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from vault.decrypted_secrets
    where name = 'open_tab_cron_secret'
      and decrypted_secret = p_secret
  );
$$;

revoke all on function public.verify_open_tab_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_open_tab_cron_secret(text) to service_role;

select vault.update_secret(
  secret_id := (select id from vault.secrets where name='open_tab_cron_secret'),
  new_secret := gen_random_uuid()::text || gen_random_uuid()::text
);

select cron.alter_job(
  job_id := (select jobid from cron.job where jobname='open-tab-hourly-watch-autopublish'),
  active := false
);
