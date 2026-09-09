import { createClient } from '@supabase/supabase-js'

export type Faculty = { id: string; name: string; slug: string }
export type Department = { id: string; faculty_id: string; name: string; slug: string; description?: string; color?: string; icon?: string; background_image?: string }

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
  { id: 'e1', faculty_id: '1', name: 'Aerospace Engineering', slug: 'aerospace-engineering', description: '[PLACEHOLDER — replace with real AFIT content] Discover resources supporting aerospace study and research.', color: '#c96d25', icon: 'plane' },
  { id: 'e2', faculty_id: '1', name: 'Electrical Engineering', slug: 'electrical-engineering', description: '[PLACEHOLDER — replace with real AFIT content] Browse teaching and research collections.', color: '#19706b', icon: 'circuit' },
  { id: 's1', faculty_id: '2', name: 'Mathematics', slug: 'mathematics', description: '[PLACEHOLDER — replace with real AFIT content] Explore mathematical sciences materials.', color: '#315a99', icon: 'sigma' },
  { id: 's2', faculty_id: '2', name: 'Physics', slug: 'physics', description: '[PLACEHOLDER — replace with real AFIT content] Access physics learning resources.', color: '#744f93', icon: 'atom' },
]

export async function getDirectory() {
  if (!supabase) return { faculties: previewFaculties, departments: previewDepartments, preview: true }
  const [faculties, departments] = await Promise.all([
    supabase.from('faculties').select('id,name,slug').order('name'),
    supabase.from('departments').select('id,faculty_id,name,slug,description,color,icon,background_image').order('name'),
  ])
  if (faculties.error) throw faculties.error
  if (departments.error) throw departments.error
  return { faculties: faculties.data as Faculty[], departments: departments.data as Department[], preview: false }
}

export async function getStats() {
  if (!supabase) return { facultyCount: previewFaculties.length, departmentCount: previewDepartments.length, preview: true }
  const [facultyResult, departmentResult] = await Promise.all([
    supabase.from('faculties').select('*', { count: 'exact', head: true }),
    supabase.from('departments').select('*', { count: 'exact', head: true }),
  ])
  if (facultyResult.error) throw facultyResult.error
  if (departmentResult.error) throw departmentResult.error
  return { facultyCount: facultyResult.count ?? 0, departmentCount: departmentResult.count ?? 0, preview: false }
}
