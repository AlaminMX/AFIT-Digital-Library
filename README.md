# AFIT Digital Library

## Local run

1. Install dependencies with `npm install`.
2. Create a `.env.local` file containing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for a Supabase project with the supplied migration applied.
3. Start the development server with `npm run dev`.

## Supabase query path

The browser client is created only when both environment variables are present. The active React Router pages use `src/lib/supabase/queries/departments.ts`:

- The home page issues count-only queries for visible faculties and departments.
- The departments page loads visible faculties and departments, ordered by `display_order`, and groups departments under the selected faculty.
- A department URL loads one visible department by its `slug`.

All queries filter `is_visible = true`.

## Required schema fields

- `faculties`: `id`, `name`, `slug`, `description`, `is_visible`, `display_order`.
- `departments`: `id`, `faculty_id`, `name`, `slug`, `description`, `is_visible`, `display_order`.

## Fallback behavior

There is no sample-data fallback. If Supabase is not configured or a query fails, pages show an unavailable state; the department directory provides a retry action.
