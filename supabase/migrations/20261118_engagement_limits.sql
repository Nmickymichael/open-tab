-- Engagement events are accepted only through trusted Edge Functions.
begin;
create table if not exists public.article_view_rate_limits(id bigint generated always as identity primary key,ip_hash text not null,article_id uuid not null references public.articles(id) on delete cascade,attempted_at timestamptz not null default now());
create index if not exists article_view_rate_idx on public.article_view_rate_limits(ip_hash,article_id,attempted_at desc);
alter table public.article_view_rate_limits enable row level security;
revoke all on public.article_view_rate_limits from anon,authenticated;
create table if not exists public.comment_rate_limits(id bigint generated always as identity primary key,ip_hash text not null,attempted_at timestamptz not null default now());
create index if not exists comment_rate_idx on public.comment_rate_limits(ip_hash,attempted_at desc);
alter table public.comment_rate_limits enable row level security;
revoke all on public.comment_rate_limits from anon,authenticated;
drop policy if exists "public submit pending comment" on public.comments;
commit;