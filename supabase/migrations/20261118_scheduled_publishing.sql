-- Scheduled articles/videos are automatically published when their UTC timestamp is reached.
create or replace function public.publish_scheduled_content()
returns integer language plpgsql security definer set search_path=public as $$
declare article_count integer:=0; video_count integer:=0;
begin
  update public.articles set status='published',updated_at=now()
  where status='scheduled' and published_at is not null and published_at<=now();
  get diagnostics article_count=row_count;
  update public.videos set status='published'
  where status='scheduled' and published_at is not null and published_at<=now();
  get diagnostics video_count=row_count;
  delete from public.newsletter_signup_rate_limits where attempted_at<now()-interval '30 days';
  delete from public.article_view_rate_limits where attempted_at<now()-interval '30 days';
  delete from public.comment_rate_limits where attempted_at<now()-interval '30 days';
  return article_count+video_count;
end; $$;
revoke all on function public.publish_scheduled_content() from public,anon,authenticated;
do $$
begin
  begin
    create extension if not exists pg_cron;
    execute 'select cron.schedule(''open-tab-publish-scheduled-content'', ''* * * * *'', ''select public.publish_scheduled_content();'')';
  exception when others then
    raise notice 'pg_cron could not be enabled automatically. Schedule select public.publish_scheduled_content(); every minute in Supabase Cron: %',sqlerrm;
  end;
end $$;
