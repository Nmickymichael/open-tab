-- OPEN TAB WATCH: editorial reviews of trending third-party YouTube videos.
begin;
alter table public.videos
  add column if not exists is_watch_review boolean not null default false,
  add column if not exists watch_category text,
  add column if not exists why_trending text,
  add column if not exists editorial_verdict text,
  add column if not exists source_url text,
  add column if not exists creator_display_name text;
create index if not exists videos_watch_reviews_public_idx
  on public.videos(is_watch_review, status, published_at desc)
  where is_watch_review = true;
comment on column public.videos.is_watch_review is 'Whether this video is featured in the separate OPEN TAB WATCH editorial review desk.';
comment on column public.videos.watch_category is 'One of Gaming, Tech, Music, Movies, Creators, Lifestyle, Viral Culture.';
comment on column public.videos.why_trending is 'Editor-written explanation of why this original YouTube video is receiving attention.';
comment on column public.videos.editorial_verdict is 'OPEN TAB original editorial assessment of the video.';
comment on column public.videos.source_url is 'Canonical original YouTube video URL; youtube_id remains the embed identifier.';
comment on column public.videos.creator_display_name is 'Creator/channel credit displayed when no linked creator profile exists.';
commit;
