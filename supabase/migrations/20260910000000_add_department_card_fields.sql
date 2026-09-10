-- Presentation metadata is optional so existing department records remain valid.
alter table public.departments
  add column if not exists color text,
  add column if not exists icon text,
  add column if not exists background_image_url text;
