-- Optional presentation metadata for public department directory cards.
alter table public.departments
  add column color text,
  add column icon text,
  add column background_image_url text;

-- Placeholder values make the existing directory cards reviewable until AFIT
-- supplies approved departmental branding and imagery.
update public.departments
set
  color = case slug
    when 'civil-engineering' then '#b45309'
    when 'electrical-engineering' then '#0f766e'
    when 'computer-science' then '#1d4ed8'
    when 'information-systems' then '#6d28d9'
    when 'mathematics' then '#4338ca'
    when 'biological-sciences' then '#15803d'
    when 'accounting' then '#0369a1'
    when 'business-administration' then '#9f1239'
    when 'economics' then '#a16207'
    when 'sociology' then '#7c3aed'
  end,
  icon = case slug
    when 'civil-engineering' then 'construction'
    when 'electrical-engineering' then 'circuit'
    when 'computer-science' then 'code'
    when 'information-systems' then 'network'
    when 'mathematics' then 'sigma'
    when 'biological-sciences' then 'atom'
    when 'accounting' then 'calculator'
    when 'business-administration' then 'briefcase'
    when 'economics' then 'chart'
    when 'sociology' then 'users'
  end,
  background_image_url = case slug
    when 'civil-engineering' then 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80'
    when 'electrical-engineering' then 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
    when 'computer-science' then 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'
    when 'information-systems' then 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80'
    when 'mathematics' then 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=1200&q=80'
    when 'biological-sciences' then 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80'
    when 'accounting' then 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80'
    when 'business-administration' then 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80'
    when 'economics' then 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80'
    when 'sociology' then 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'
  end;
