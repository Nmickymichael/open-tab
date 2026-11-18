-- Publicly display contributor profiles only when they have published work.
begin;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists social_links jsonb not null default '{}'::jsonb;
drop policy if exists "public read published contributors" on public.profiles;
create policy "public read published contributors" on public.profiles for select to anon,authenticated
using(exists(select 1 from public.articles a where a.author_id=profiles.id and a.status='published' and a.published_at<=now()));
commit;
