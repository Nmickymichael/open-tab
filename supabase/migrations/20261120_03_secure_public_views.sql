-- Keep the public trending feed under caller RLS while exposing only safe aggregates.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.public_article_view_count(p_article_id uuid)
returns bigint
language sql stable security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.article_views av
  join public.articles a on a.id = av.article_id
  where av.article_id = p_article_id
    and a.status = 'published'
    and a.published_at <= now();
$$;
revoke all on function private.public_article_view_count(uuid) from public;
grant execute on function private.public_article_view_count(uuid) to anon, authenticated;

create or replace view public.public_trending_articles
with (security_invoker = true)
as
select a.id,a.title,a.slug,a.excerpt,a.cover_image,a.cover_image_alt,a.published_at,
       c.name as category_name,c.slug as category_slug,
       private.public_article_view_count(a.id) as view_count
from public.articles a
left join public.categories c on c.id=a.category_id
where a.status='published' and a.published_at<=now()
order by private.public_article_view_count(a.id) desc,a.published_at desc;
grant select on public.public_trending_articles to anon, authenticated;

create or replace function public.get_poll_results(p_poll_id uuid)
returns table(option_id uuid,vote_count bigint)
language sql stable security definer set search_path=public as $$
  select o.id,count(v.id)::bigint
  from public.reader_poll_options o
  join public.reader_polls p on p.id=o.poll_id
  left join public.reader_poll_votes v on v.option_id=o.id
  where o.poll_id=p_poll_id
    and (p.is_active or public.has_editor_access())
  group by o.id
  order by o.sort_order;
$$;
revoke all on function public.get_poll_results(uuid) from public;
grant execute on function public.get_poll_results(uuid) to anon, authenticated;
commit;