-- OPEN TAB reader, discovery, multimedia and editorial workflow expansion.
-- Apply after the existing foundation, hardening and admin-only publishing migrations.
begin;

alter table public.profiles alter column role set default 'reader';
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,display_name,role)
  values(new.id,coalesce(new.raw_user_meta_data->>'display_name','OPEN TAB Reader'),'reader');
  return new;
end; $$;

alter table public.articles
  add column if not exists is_breaking boolean not null default false,
  add column if not exists is_story_of_day boolean not null default false,
  add column if not exists is_editors_pick boolean not null default false,
  add column if not exists is_weekend_read boolean not null default false,
  add column if not exists is_original boolean not null default false,
  add column if not exists reading_time_minutes integer not null default 1,
  add column if not exists correction_note text;
alter table public.videos
  add column if not exists transcript_text text,
  add column if not exists subtitle_url text,
  add column if not exists video_type text not null default 'video' check(video_type in ('video','podcast'));

create index if not exists articles_breaking_idx on public.articles(is_breaking,published_at desc) where status='published';
create index if not exists articles_editor_picks_idx on public.articles(is_editors_pick,published_at desc) where status='published';
create index if not exists articles_story_day_idx on public.articles(is_story_of_day,published_at desc) where status='published';

-- Reader library and topic/creator follows.
create table if not exists public.reader_bookmarks(
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,article_id)
);
create table if not exists public.reader_follows(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  creator_id uuid references public.creators(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint reader_follow_target check(num_nonnulls(category_id,creator_id)=1),
  constraint reader_follow_unique_category unique(user_id,category_id),
  constraint reader_follow_unique_creator unique(user_id,creator_id)
);
create table if not exists public.article_reactions(
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  reaction text not null check(reaction in ('like','love','fire','clap')),
  created_at timestamptz not null default now(),
  primary key(user_id,article_id)
);

-- Polls are authored by editorial staff; readers can vote once per poll.
create table if not exists public.reader_polls(
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text,
  is_active boolean not null default false,
  closes_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create table if not exists public.reader_poll_options(
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.reader_polls(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);
create table if not exists public.reader_poll_votes(
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.reader_polls(id) on delete cascade,
  option_id uuid not null references public.reader_poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(poll_id,user_id)
);

-- Editorial operations: immutable snapshots, assignments, sources and corrections.
create table if not exists public.article_revisions(
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles(id) on delete cascade,
  changed_by uuid references public.profiles(id),
  title text not null,
  excerpt text,
  content text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.content_assignments(
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  due_at timestamptz,
  notes text,
  status text not null default 'assigned' check(status in ('assigned','in_progress','submitted','completed')),
  created_at timestamptz not null default now()
);
create table if not exists public.article_sources(
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  label text not null,
  source_url text,
  notes text,
  added_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create table if not exists public.content_corrections(
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  correction text not null,
  corrected_at timestamptz not null default now(),
  corrected_by uuid references public.profiles(id)
);
create table if not exists public.reader_notifications(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Publicly safe aggregate: only published stories are exposed.
create or replace view public.public_trending_articles as
select a.id,a.title,a.slug,a.excerpt,a.cover_image,a.cover_image_alt,a.published_at,
       c.name as category_name,c.slug as category_slug,count(v.id)::bigint as view_count
from public.articles a
left join public.categories c on c.id=a.category_id
left join public.article_views v on v.article_id=a.id
where a.status='published' and a.published_at<=now()
group by a.id,c.name,c.slug
order by count(v.id) desc,a.published_at desc;
grant select on public.public_trending_articles to anon,authenticated;

create or replace function public.capture_article_revision()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.title is distinct from new.title or old.excerpt is distinct from new.excerpt or old.content is distinct from new.content then
    insert into public.article_revisions(article_id,changed_by,title,excerpt,content)
    values(old.id,auth.uid(),old.title,old.excerpt,old.content);
  end if;
  return new;
end; $$;
drop trigger if exists article_revision_snapshot on public.articles;
create trigger article_revision_snapshot before update on public.articles
for each row execute function public.capture_article_revision();

create or replace function public.notify_category_followers_on_publish()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='published' and new.published_at<=now()
     and (tg_op='INSERT' or old.status is distinct from 'published' or old.published_at is distinct from new.published_at) then
    insert into public.reader_notifications(user_id,title,body,href)
    select rf.user_id,'New story in '||coalesce(c.name,'a followed topic'),new.title,'/story/'||new.slug
    from public.reader_follows rf
    left join public.categories c on c.id=rf.category_id
    where rf.category_id=new.category_id;
  end if;
  return new;
end; $$;
drop trigger if exists notify_category_followers_after_publish on public.articles;
create trigger notify_category_followers_after_publish
after insert or update of status,published_at on public.articles
for each row execute function public.notify_category_followers_on_publish();

alter table public.reader_bookmarks enable row level security;
alter table public.reader_follows enable row level security;
alter table public.article_reactions enable row level security;
alter table public.reader_polls enable row level security;
alter table public.reader_poll_options enable row level security;
alter table public.reader_poll_votes enable row level security;
alter table public.article_revisions enable row level security;
alter table public.content_assignments enable row level security;
alter table public.article_sources enable row level security;
alter table public.content_corrections enable row level security;
alter table public.reader_notifications enable row level security;

drop policy if exists "reader bookmarks own" on public.reader_bookmarks;
create policy "reader bookmarks own" on public.reader_bookmarks for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "reader follows own" on public.reader_follows for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "reader reactions own" on public.article_reactions for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "public read active polls" on public.reader_polls for select to anon,authenticated using(is_active and (closes_at is null or closes_at>now()) or public.has_editor_access());
create policy "public read poll options" on public.reader_poll_options for select to anon,authenticated using(exists(select 1 from public.reader_polls p where p.id=poll_id and (p.is_active or public.has_editor_access())));
create policy "read own poll vote" on public.reader_poll_votes for select to authenticated using(user_id=auth.uid());
create policy "reader vote once" on public.reader_poll_votes for insert to authenticated
with check(user_id=auth.uid() and exists(select 1 from public.reader_polls p where p.id=poll_id and p.is_active and (p.closes_at is null or p.closes_at>now())) and exists(select 1 from public.reader_poll_options o where o.id=reader_poll_votes.option_id and o.poll_id=reader_poll_votes.poll_id));
create or replace function public.get_poll_results(p_poll_id uuid)
returns table(option_id uuid,vote_count bigint)
language sql stable security definer set search_path=public as $$
  select o.id,count(v.id)::bigint
  from public.reader_poll_options o
  left join public.reader_poll_votes v on v.option_id=o.id
  where o.poll_id=p_poll_id
  group by o.id
  order by o.sort_order;
$$;
revoke all on function public.get_poll_results(uuid) from public;
grant execute on function public.get_poll_results(uuid) to anon,authenticated;
create policy "editors manage polls" on public.reader_polls for all to authenticated using(public.has_editor_access()) with check(public.has_editor_access());
create policy "editors manage poll options" on public.reader_poll_options for all to authenticated using(public.has_editor_access()) with check(public.has_editor_access());
create policy "editors read revisions" on public.article_revisions for select to authenticated using(public.has_editor_access() or exists(select 1 from public.articles a where a.id=article_id and a.author_id=auth.uid()));
create policy "editors read assignments" on public.content_assignments for select to authenticated using(public.has_editor_access() or assigned_to=auth.uid());
create policy "editors manage assignments" on public.content_assignments for all to authenticated using(public.has_editor_access()) with check(public.has_editor_access());
create policy "editors manage sources" on public.article_sources for all to authenticated using(public.has_editor_access()) with check(public.has_editor_access());
create policy "public read corrections" on public.content_corrections for select to anon,authenticated using(exists(select 1 from public.articles a where a.id=article_id and a.status='published' and a.published_at<=now()));
create policy "editors manage corrections" on public.content_corrections for all to authenticated using(public.has_editor_access()) with check(public.has_editor_access());
create policy "reader notifications own" on public.reader_notifications for select to authenticated using(user_id=auth.uid());
create policy "reader update own notifications" on public.reader_notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

commit;
