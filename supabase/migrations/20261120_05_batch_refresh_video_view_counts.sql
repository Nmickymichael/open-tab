-- Secure, batched updater for YouTube view counts from the hourly discovery job.
begin;
create or replace function public.refresh_video_view_counts(p_counts jsonb)
returns integer
language plpgsql
set search_path = public
as $$
declare
  changed integer;
begin
  update public.videos as v
  set view_count = incoming.view_count
  from jsonb_to_recordset(coalesce(p_counts,'[]'::jsonb))
    as incoming(id uuid, view_count bigint)
  where v.id = incoming.id
    and incoming.view_count >= 0;
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function public.refresh_video_view_counts(jsonb) from public;
revoke all on function public.refresh_video_view_counts(jsonb) from anon, authenticated;
grant execute on function public.refresh_video_view_counts(jsonb) to service_role;
commit;
