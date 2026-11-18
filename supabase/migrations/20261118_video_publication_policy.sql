-- Public videos must be published AND past their publication timestamp.
begin;
drop policy if exists "read published videos" on public.videos;
create policy "read published videos" on public.videos for select
using((status='published' and published_at is not null and published_at<=now()) or public.has_editor_access());
commit;
