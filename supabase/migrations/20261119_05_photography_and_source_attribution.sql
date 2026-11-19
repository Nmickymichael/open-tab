-- OPEN TAB: image rights, photographer credits and original reporting provenance.
-- Apply after the existing OPEN TAB migrations.
alter table public.articles
  add column if not exists cover_image_credit text,
  add column if not exists cover_image_source text,
  add column if not exists cover_image_license text,
  add column if not exists source_url text,
  add column if not exists source_platform text;

comment on column public.articles.cover_image_credit is 'Verified photographer, agency or rights-holder credit displayed with the published image.';
comment on column public.articles.cover_image_source is 'Original image source page or rights-holder URL; not necessarily the same as the article source.';
comment on column public.articles.cover_image_license is 'Licence, permission or usage terms recorded by the editorial team.';
comment on column public.articles.source_url is 'Primary reporting source or original public social post for reader attribution.';
comment on column public.articles.source_platform is 'Origin platform for the primary source, e.g. Instagram, YouTube, TikTok, X or News organisation.';

insert into public.categories(name,slug,description,sort_order)
values
 ('Gaming','gaming','Games, esports, streaming and the communities playing them.',12),
 ('Music','music','New releases, live performances, artists and music culture.',13),
 ('Movies','movies','Film releases, trailers, reviews and the people making cinema.',14),
 ('Viral Culture','viral-culture','Memes, challenges, internet debates and moments spreading across platforms.',15)
on conflict(slug) do update set description=excluded.description;
