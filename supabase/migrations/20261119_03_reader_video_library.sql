-- OPEN TAB reader video library and viewing history.
begin;
create table if not exists public.reader_video_watchlist(
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,video_id)
);
create table if not exists public.reader_video_history(
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  last_watched_at timestamptz not null default now(),
  primary key(user_id,video_id)
);
alter table public.reader_video_watchlist enable row level security;
alter table public.reader_video_history enable row level security;
create policy "reader video watchlist own" on public.reader_video_watchlist for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "reader video history own" on public.reader_video_history for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
commit;
