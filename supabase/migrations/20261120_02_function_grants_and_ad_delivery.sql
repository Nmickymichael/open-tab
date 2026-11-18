-- OPEN TAB: tighten callable function grants and make public ad delivery obey RLS.
begin;

-- These functions are trigger entrypoints and must never be callable as RPCs.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.capture_article_revision() from public, anon, authenticated;
revoke all on function public.notify_category_followers_on_publish() from public, anon, authenticated;
revoke all on function public.write_editorial_audit_log() from public, anon, authenticated;

-- Newsletter token operations are only invoked by trusted Edge Functions.
revoke all on function public.confirm_newsletter_subscription(uuid) from public, anon, authenticated;
revoke all on function public.unsubscribe_newsletter(uuid) from public, anon, authenticated;
grant execute on function public.confirm_newsletter_subscription(uuid) to service_role;
grant execute on function public.unsubscribe_newsletter(uuid) to service_role;

-- Keep the public ad view least-privileged: it runs with the caller's rights,
-- and the campaign table exposes only active campaigns through RLS.
create or replace view public.active_ad_creatives
with (security_invoker = true)
as
select c.id,c.headline,c.description,c.creative_url,c.destination_url,c.placement,
       c.starts_at,c.ends_at
from public.ad_campaigns c
where c.status='active'
  and (c.starts_at is null or c.starts_at<=now())
  and (c.ends_at is null or c.ends_at>now());

grant select on public.ad_campaigns to anon, authenticated;
drop policy if exists "public read active ad campaigns" on public.ad_campaigns;
create policy "public read active ad campaigns" on public.ad_campaigns
for select to anon, authenticated
using (
  status='active'
  and (starts_at is null or starts_at<=now())
  and (ends_at is null or ends_at>now())
);
grant select on public.active_ad_creatives to anon, authenticated;

commit;