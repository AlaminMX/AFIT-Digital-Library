-- Faculty and department catalogue used by the public landing page.
create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index departments_faculty_id_display_order_idx
  on public.departments (faculty_id, display_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger faculties_set_updated_at
before update on public.faculties
for each row execute function public.set_updated_at();

create trigger departments_set_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

alter table public.faculties enable row level security;
alter table public.departments enable row level security;

create policy "Anonymous users can read visible faculties"
on public.faculties
for select
to anon
using (is_visible = true);

create policy "Anonymous users can read visible departments"
on public.departments
for select
to anon
using (is_visible = true);

-- Placeholder only: AFIT must replace this structure with real institutional data before launch.
insert into public.faculties (id, name, slug, description, display_order)
values
  ('a1000000-0000-4000-8000-000000000001', 'Faculty of Engineering', 'engineering', 'Placeholder faculty for engineering programmes.', 1),
  ('a1000000-0000-4000-8000-000000000002', 'Faculty of Computing and Informatics', 'computing-and-informatics', 'Placeholder faculty for computing programmes.', 2),
  ('a1000000-0000-4000-8000-000000000003', 'Faculty of Science', 'science', 'Placeholder faculty for science programmes.', 3),
  ('a1000000-0000-4000-8000-000000000004', 'Faculty of Business and Management', 'business-and-management', 'Placeholder faculty for management programmes.', 4),
  ('a1000000-0000-4000-8000-000000000005', 'Faculty of Social Sciences', 'social-sciences', 'Placeholder faculty for social science programmes.', 5);

insert into public.departments (faculty_id, name, slug, description, display_order)
values
  ('a1000000-0000-4000-8000-000000000001', 'Department of Civil Engineering', 'civil-engineering', 'Placeholder department.', 1),
  ('a1000000-0000-4000-8000-000000000001', 'Department of Electrical Engineering', 'electrical-engineering', 'Placeholder department.', 2),
  ('a1000000-0000-4000-8000-000000000002', 'Department of Computer Science', 'computer-science', 'Placeholder department.', 1),
  ('a1000000-0000-4000-8000-000000000002', 'Department of Information Systems', 'information-systems', 'Placeholder department.', 2),
  ('a1000000-0000-4000-8000-000000000003', 'Department of Mathematics', 'mathematics', 'Placeholder department.', 1),
  ('a1000000-0000-4000-8000-000000000003', 'Department of Biological Sciences', 'biological-sciences', 'Placeholder department.', 2),
  ('a1000000-0000-4000-8000-000000000004', 'Department of Accounting', 'accounting', 'Placeholder department.', 1),
  ('a1000000-0000-4000-8000-000000000004', 'Department of Business Administration', 'business-administration', 'Placeholder department.', 2),
  ('a1000000-0000-4000-8000-000000000005', 'Department of Economics', 'economics', 'Placeholder department.', 1),
  ('a1000000-0000-4000-8000-000000000005', 'Department of Sociology', 'sociology', 'Placeholder department.', 2);
