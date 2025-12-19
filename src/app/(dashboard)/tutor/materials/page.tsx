import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MaterialsManager, LibraryItem, MaterialInstance } from '@/components/tutor/materials-manager'

export default async function TutorMaterialsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'tutor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  // Get all courses for dropdowns
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .order('name')

  // Get all materials
  const { data: materials } = await supabase
    .from('materials')
    .select(`
      *,
      courses (name),
      material_categories (name)
    `)
    .order('created_at', { ascending: false })

  // Group materials by file_path or link_url
  const libraryMap = new Map<string, LibraryItem>()

  materials?.forEach((m) => {
    // Identify unique key: file_path or link_url. If neither, skip?
    const key = m.file_path || m.link_url
    if (!key) return

    if (!libraryMap.has(key)) {
      libraryMap.set(key, {
        key,
        title: m.title, // Use the most recent title as the main one
        type: m.material_type === 'link' ? 'link' : 'file',
        file_type: m.file_type || undefined,
        instances: []
      })
    }

    const item = libraryMap.get(key)!

    // Add instance
    const instance: MaterialInstance = {
      id: m.id,
      title: m.title,
      description: m.description,
      created_at: m.created_at || new Date().toISOString(),
      course_name: (m.courses as any)?.name || 'Sconosciuto',
      category_name: (m.material_categories as any)?.name || null
    }

    item.instances.push(instance)
  })

  const library = Array.from(libraryMap.values())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Materiali Didattici</h1>
          <p className="text-gray-600">Gestisci la libreria dei materiali e le associazioni ai corsi.</p>
        </div>
      </div>

      <MaterialsManager
        initialMaterials={library} // Renamed prop usage if needed, or keeping explicit props
        library={library}
        courses={courses || []}
        showLibraryTab={false}
      />
    </div>
  )
}
