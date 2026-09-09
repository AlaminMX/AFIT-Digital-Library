# AFIT Digital Library

## Data integration

The landing-page totals and department directory are read from Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are supplied. The UI intentionally retains a small illustrative dataset when those values are absent so that a local preview remains useful. **Those fallback labels and values are visibly marked as placeholders in the UI and must not be treated as AFIT facts.**

Expected tables are `faculties` (`id`, `name`, `slug`) and `departments` (`id`, `faculty_id`, `name`, `slug`, `description`, optional `color`, `icon`, `background_image`). The implementation uses count-only queries for landing statistics to avoid downloading entire tables.

## Implementation decisions

* Department illustrations use CSS image overlays; an unavailable image does not obscure the readable content or color identity.
* The selector is a horizontal, scrollable tab list on narrow screens rather than a native select, so keyboard users retain a clear active faculty and can move directly to it.
* Contact and social details are deliberately labelled placeholders, since no approved AFIT contact source was included in this repository.
