-- OPEN TAB advertising and sponsorship foundation.
-- Apply after the existing schema and editorial migrations.
begin;

create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text not null,
  website_url text,
  status text not null default 'prospect' check (status in ('prospect','active','paused','archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers(id) on delete restrict,
  name text not null,
  headline text not null,
  description text,
  creative_url text,
  destination_url text not null,
  placement text not null check (placement in ('homepage_leaderboard','homepage_feature','article_inline','sidebar','video_sponsorship','newsletter')),
  status text not null default 'draft' check (status in ('draft','pending_review','approved','active','paused','completed','rejected')),
  starts_at timestamptz,
  ends_at timestamptz,
  budget_cents bigint not null default 0 check (budget_cents >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_campaign_dates check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.ad_events (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  event_type text not null check (event_type in ('impression','click')),
  occurred_at timestamptz not null default now()
);

create index if not exists ad_campaigns_delivery_idx
  on public.ad_campaigns(placement,status,starts_at,ends_at);
create index if not exists ad_events_campaign_time_idx
  on public.ad_events(campaign_id,occurred_at desc);

alter table public.advertisers enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_events enable row level security;

drop policy if exists "admins manage advertisers" on public.advertisers;
create policy "admins manage advertisers" on public.advertisers
  for all to authenticated using (public.has_admin_access())
  with check (public.has_admin_access());

drop policy if exists "editors read advertisers" on public.advertisers;
create policy "editors read advertisers" on public.advertisers
  for select to authenticated using (public.has_editor_access());

drop policy if exists "admins manage ad campaigns" on public.ad_campaigns;
create policy "admins manage ad campaigns" on public.ad_campaigns
  for all to authenticated using (public.has_admin_access())
  with check (public.has_admin_access());

drop policy if exists "editors read ad campaigns" on public.ad_campaigns;
create policy "editors read ad campaigns" on public.ad_campaigns
  for select to authenticated using (public.has_editor_access());

drop policy if exists "public record ad events" on public.ad_events;
create policy "public record ad events" on public.ad_events
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.ad_campaigns c
      where c.id = campaign_id
        and c.status = 'active'
        and (c.starts_at is null or c.starts_at <= now())
        and (c.ends_at is null or c.ends_at > now())
    )
  );

drop policy if exists "admins read ad events" on public.ad_events;
create policy "admins read ad events" on public.ad_events
  for select to authenticated using (public.has_admin_access());

create or replace view public.active_ad_creatives as
select c.id,c.headline,c.description,c.creative_url,c.destination_url,c.placement,
       c.starts_at,c.ends_at
from public.ad_campaigns c
where c.status='active'
  and (c.starts_at is null or c.starts_at<=now())
  and (c.ends_at is null or c.ends_at>now());

grant select on public.active_ad_creatives to anon,authenticated;
grant insert on public.ad_events to anon,authenticated;

commit;
