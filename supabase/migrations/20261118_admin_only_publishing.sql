-- OPEN TAB: only administrators may publish or schedule articles and videos.
-- Apply after the existing foundation and hardening migrations.
begin;

-- Remove the permissive article write policies from the foundation schema.
drop policy if exists "authors create drafts" on public.articles;
drop policy if exists "editors create articles" on public.articles;
drop policy if exists "authors edit drafts editors all" on public.articles;

-- Authors may submit their own drafts/review items. Editors may create and
-- edit non-published work. Only admins may set published/scheduled status.
create policy "authors and editors create unpublished articles"
on public.articles for insert
to authenticated
with check (
  (
    public.current_user_role() = 'author'
    and author_id = auth.uid()
    and status in ('draft','review')
  )
  or (
    public.current_user_role() = 'editor'
    and status in ('draft','review','archived')
  )
  or public.has_admin_access()
);

create policy "authors and editors update unpublished articles"
on public.articles for update
to authenticated
using (
  public.has_admin_access()
  or (
    public.current_user_role() = 'editor'
    and status in ('draft','review','archived')
  )
  or (
    public.current_user_role() = 'author'
    and author_id = auth.uid()
    and status in ('draft','review')
  )
)
with check (
  public.has_admin_access()
  or (
    public.current_user_role() = 'editor'
    and status in ('draft','review','archived')
  )
  or (
    public.current_user_role() = 'author'
    and author_id = auth.uid()
    and status in ('draft','review')
  )
);

-- Replace the broad editor video-management policy. Editors can prepare
-- videos, but cannot publish or schedule them.
drop policy if exists "editors manage videos" on public.videos;

create policy "editors and admins create videos"
on public.videos for insert
to authenticated
with check (
  public.has_admin_access()
  or (
    public.current_user_role() = 'editor'
    and status in ('draft','review','archived')
  )
);

create policy "editors and admins update videos"
on public.videos for update
to authenticated
using (
  public.has_admin_access()
  or (
    public.current_user_role() = 'editor'
    and status in ('draft','review','archived')
  )
)
with check (
  public.has_admin_access()
  or (
    public.current_user_role() = 'editor'
    and status in ('draft','review','archived')
  )
);

create policy "editors and admins delete videos"
on public.videos for delete
to authenticated
using (public.has_editor_access());

commit;
