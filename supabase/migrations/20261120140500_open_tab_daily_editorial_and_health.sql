create table if not exists public.editorial_story_leads (
 id uuid primary key default gen_random_uuid(),
 story_date date not null default ((now() at time zone 'Africa/Nairobi')::date),
 headline text not null,
 source_name text,
 source_url text not null unique,
 source_published_at timestamptz,
 region text,
 status text not null default 'new' check(status in ('new','drafted','dismissed')),
 article_id uuid references public.articles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists editorial_story_leads_date_status_idx on public.editorial_story_leads(story_date desc,status,created_at desc);
alter table public.editorial_story_leads enable row level security;
drop policy if exists "Editors can view editorial story leads" on public.editorial_story_leads;
create policy "Editors can view editorial story leads" on public.editorial_story_leads for select to authenticated using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','editor')));
drop policy if exists "Editors can update editorial story leads" on public.editorial_story_leads;
create policy "Editors can update editorial story leads" on public.editorial_story_leads for update to authenticated using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','editor'))) with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','editor')));
revoke all on public.editorial_story_leads from anon;
grant select,update on public.editorial_story_leads to authenticated;
grant all on public.editorial_story_leads to service_role;

create table if not exists public.publisher_health_events (
 event_date date primary key,
 status text not null check(status in ('healthy','missed','error')),
 published_article_count integer not null default 0,
 watch_video_count integer not null default 0,
 details text,
 checked_at timestamptz not null default now()
);
alter table public.publisher_health_events enable row level security;
drop policy if exists "Admins and editors can view publisher health" on public.publisher_health_events;
create policy "Admins and editors can view publisher health" on public.publisher_health_events for select to authenticated using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','editor')));
revoke all on public.publisher_health_events from anon;
grant select on public.publisher_health_events to authenticated;
grant all on public.publisher_health_events to service_role;

do $$
declare d bigint; h bigint; dc text; hc text;
begin
 dc := $cmd$select net.http_post(url:='https://pescptzxxgtkzbneedda.supabase.co/functions/v1/open-tab-daily-editorial',headers:=jsonb_build_object('Content-Type','application/json','x-open-tab-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='open_tab_cron_secret')),body:=jsonb_build_object('task','discover'));$cmd$;
 hc := $cmd$select net.http_post(url:='https://pescptzxxgtkzbneedda.supabase.co/functions/v1/open-tab-daily-editorial',headers:=jsonb_build_object('Content-Type','application/json','x-open-tab-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='open_tab_cron_secret')),body:=jsonb_build_object('task','health'));$cmd$;
 select jobid into d from cron.job where jobname='open-tab-daily-story-discovery';
 if d is null then perform cron.schedule('open-tab-daily-story-discovery','0 3 * * *',dc);
 else perform cron.alter_job(job_id:=d,schedule:='0 3 * * *',command:=dc,active:=true); end if;
 select jobid into h from cron.job where jobname='open-tab-publisher-health-monitor';
 if h is null then perform cron.schedule('open-tab-publisher-health-monitor','0 15 * * *',hc);
 else perform cron.alter_job(job_id:=h,schedule:='0 15 * * *',command:=hc,active:=true); end if;
end $$;