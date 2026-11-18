-- OPEN TAB RLS configuration smoke checks.
-- Run after all schema and migration files. This checks configuration, not
-- identity-specific behaviour; test anonymous/author/editor/admin sessions too.
do $$
declare missing text;
begin
  select string_agg(tablename, ', ') into missing from unnest(array[
    'profiles','categories','articles','tags','article_tags','creators',
    'videos','newsletter_subscribers','comments','article_views','audit_logs',
    'newsletter_signup_rate_limits','article_view_rate_limits','comment_rate_limits'
  ]) as x(tablename) where not coalesce((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=tablename),false);
  if missing is not null then raise exception 'RLS is not enabled on: %',missing; end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and cmd in ('UPDATE','ALL') and roles @> array['authenticated']::name[]) then
    raise exception 'Unsafe profile update policy exists; users must not be able to self-assign roles.';
  end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='newsletter_subscribers' and cmd in ('INSERT','ALL') and roles @> array['anon']::name[]) then
    raise exception 'Direct anonymous newsletter writes are enabled; use the newsletter Edge Function.';
  end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='comments' and cmd in ('INSERT','ALL') and roles @> array['anon']::name[]) then
    raise exception 'Direct anonymous comment writes are enabled; use the comment Edge Function.';
  end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='article_views' and cmd in ('INSERT','ALL') and roles @> array['anon']::name[]) then
    raise exception 'Direct anonymous analytics writes are enabled; use the article-view Edge Function.';
  end if;
  if not coalesce((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='storage' and c.relname='objects'),false) then
    raise exception 'RLS is not enabled on storage.objects.';
  end if;
end $$;
select schemaname,tablename,policyname,cmd,roles,qual,with_check
from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname;
