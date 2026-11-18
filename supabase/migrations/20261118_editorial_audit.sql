-- Append-only editorial audit events for key content operations.
begin;
create or replace function public.write_editorial_audit_log()
returns trigger language plpgsql security definer set search_path=public as $$
declare record_id text;
begin
  if tg_op='DELETE' then record_id=coalesce(to_jsonb(old)->>'id',''); else record_id=coalesce(to_jsonb(new)->>'id',''); end if;
  insert into public.audit_logs(actor_id,action,entity,entity_id)
  values(auth.uid(),lower(tg_op),tg_table_name,record_id);
  if tg_op='DELETE' then return old; else return new; end if;
end; $$;
revoke all on function public.write_editorial_audit_log() from public;
drop trigger if exists audit_articles on public.articles;
create trigger audit_articles after insert or update or delete on public.articles for each row execute function public.write_editorial_audit_log();
drop trigger if exists audit_videos on public.videos;
create trigger audit_videos after insert or update or delete on public.videos for each row execute function public.write_editorial_audit_log();
drop trigger if exists audit_creators on public.creators;
create trigger audit_creators after insert or update or delete on public.creators for each row execute function public.write_editorial_audit_log();
drop trigger if exists audit_categories on public.categories;
create trigger audit_categories after insert or update or delete on public.categories for each row execute function public.write_editorial_audit_log();
drop trigger if exists audit_comments on public.comments;
create trigger audit_comments after insert or update or delete on public.comments for each row execute function public.write_editorial_audit_log();
commit;
