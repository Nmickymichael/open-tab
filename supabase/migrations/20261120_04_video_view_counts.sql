-- Store YouTube's public view count on OPEN TAB video records.
-- The hourly discovery function already receives statistics.viewCount with its
-- existing videos.list request, so this adds no per-video API calls.
begin;
alter table public.videos
  add column if not exists view_count bigint;
comment on column public.videos.view_count is
  'Latest public view count returned by the original video provider; null when unavailable or not supplied.';
commit;
