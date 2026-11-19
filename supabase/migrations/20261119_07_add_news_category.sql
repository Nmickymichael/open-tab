-- Add a dedicated global News destination to OPEN TAB navigation.
insert into public.categories (name, slug, description, sort_order, is_active)
values (
  'News',
  'news',
  'The latest international headlines, verified reporting and perspectives from trusted publishers around the world.',
  0,
  true
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true;
