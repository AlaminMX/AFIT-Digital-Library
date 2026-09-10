-- Carousel slides catalogue for homepage showcase
create table if not exists public.carousel_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text not null,
  cta_text text,
  cta_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists carousel_slides_display_order_idx
  on public.carousel_slides (display_order);

create trigger carousel_slides_set_updated_at
before update on public.carousel_slides
for each row execute function public.set_updated_at();

alter table public.carousel_slides enable row level security;

-- Public users can only read active slides
create policy "Anonymous users can read active carousel slides"
on public.carousel_slides
for select
to anon
using (is_active = true);

-- Authenticated administrator can manage all slides
create policy "Authenticated users can manage carousel slides"
on public.carousel_slides
for all
to authenticated
using (true)
with check (true);
