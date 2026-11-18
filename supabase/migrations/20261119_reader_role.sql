-- Add the reader role separately so PostgreSQL commits the enum value
-- before a later migration uses it as a column default or function value.
alter type public.app_role add value if not exists 'reader';
