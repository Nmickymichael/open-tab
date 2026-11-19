-- Store a direct licence URL for each editorial cover image when a licence applies.
alter table public.articles
  add column if not exists cover_image_license_url text;

comment on column public.articles.cover_image_license_url is
  'Direct URL to the image licence, when applicable, displayed with the public photo credit.';
