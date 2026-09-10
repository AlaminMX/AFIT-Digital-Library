import { createClient } from '@supabase/supabase-js'

export type Faculty = { id: string; name: string; slug: string }
export type Department = {
  id: string
  faculty_id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  background_image_url: string | null
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const supabase = url && key ? createClient(url, key) : null

// This preview data lets the design be reviewed without credentials; it is explicitly labelled in the UI.
const previewFaculties: Faculty[] = [
  { id: '1', name: 'Engineering', slug: 'engineering' },
  { id: '2', name: 'Sciences', slug: 'sciences' },
  { id: '3', name: 'Management Studies', slug: 'management-studies' },
]
const previewDepartments: Department[] = [
  { id: 'e1', faculty_id: '1', name: 'Aerospace Engineering', slug: 'aerospace-engineering', description: '[PLACEHOLDER — replace with real AFIT content] Discover resources supporting aerospace study and research.', color: '#c96d25', icon: 'plane', background_image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80' },
  { id: 'e2', faculty_id: '1', name: 'Electrical Engineering', slug: 'electrical-engineering', description: '[PLACEHOLDER — replace with real AFIT content] Browse teaching and research collections.', color: '#19706b', icon: 'circuit', background_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80' },
  { id: 's1', faculty_id: '2', name: 'Mathematics', slug: 'mathematics', description: '[PLACEHOLDER — replace with real AFIT content] Explore mathematical sciences materials.', color: '#315a99', icon: 'sigma', background_image_url: 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=1200&q=80' },
  { id: 's2', faculty_id: '2', name: 'Physics', slug: 'physics', description: '[PLACEHOLDER — replace with real AFIT content] Access physics learning resources.', color: '#744f93', icon: 'atom', background_image_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=1200&q=80' },
]

export async function getDirectory() {
  if (!supabase) return { faculties: previewFaculties, departments: previewDepartments, preview: true }
  const [faculties, departments] = await Promise.all([
    supabase.from('faculties').select('id,name,slug').eq('is_visible', true).order('name'),
    supabase.from('departments').select('id,faculty_id,name,slug,description,color,icon,background_image_url').eq('is_visible', true).order('name'),
  ])
  if (faculties.error) throw faculties.error
  if (departments.error) throw departments.error
  return { faculties: faculties.data as Faculty[], departments: departments.data as Department[], preview: false }
}

export async function getStats() {
  if (!supabase) return { facultyCount: previewFaculties.length, departmentCount: previewDepartments.length, preview: true }
  const [facultyResult, departmentResult] = await Promise.all([
    supabase.from('faculties').select('*', { count: 'exact', head: true }).eq('is_visible', true),
    supabase.from('departments').select('*', { count: 'exact', head: true }).eq('is_visible', true),
  ])
  if (facultyResult.error) throw facultyResult.error
  if (departmentResult.error) throw departmentResult.error
  return { facultyCount: facultyResult.count ?? 0, departmentCount: departmentResult.count ?? 0, preview: false }
}
