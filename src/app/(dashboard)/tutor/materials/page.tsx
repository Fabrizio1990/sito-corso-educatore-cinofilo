import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UploadMaterialDialog } from '@/components/tutor/upload-material-dialog'
import { DeleteMaterialButton } from '@/components/tutor/delete-material-button'
import { ManageCategoriesDialog } from '@/components/tutor/manage-categories-dialog'

interface Material {
  id: string
  title: string
  description: string | null
  file_path: string | null
  file_type: string | null
  link_url: string | null
  material_type: string | null
  category_id: string | null
  created_at: string
  courses: { name: string } | null
  material_categories: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
  course_id: string
  materials: Material[]
}

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

  // Get all courses for the dropdown
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .order('name')

  // Get all categories with their materials
  const { data: categories } = await (supabase as unknown as { from: (table: string) => { select: (query: string) => { order: (col: string) => Promise<{ data: Category[] | null }> } } })
    .from('material_categories')
    .select(`
      id,
      name,
      course_id,
      courses (name)
    `)
    .order('sort_order')

  // Get all materials with category info
  const { data: materials } = await supabase
    .from('materials')
    .select(`
      *,
      courses (name),
      material_categories (id, name)
    `)
    .order('created_at', { ascending: false })

  // Organize materials by course and category
  type CourseData = {
    name: string
    categories: Map<string, { name: string; materials: Material[] }>
    uncategorized: Material[]
  }

  const materialsByCourse = new Map<string, CourseData>()

  materials?.forEach((material) => {
    const courseName = (material.courses as { name: string })?.name || 'Senza corso'
    const courseId = material.course_id

    if (!materialsByCourse.has(courseId)) {
      materialsByCourse.set(courseId, {
        name: courseName,
        categories: new Map(),
        uncategorized: [],
      })
    }

    const courseData = materialsByCourse.get(courseId)!
    const category = (material as unknown as { material_categories: { id: string; name: string } | null }).material_categories

    if (category) {
      if (!courseData.categories.has(category.id)) {
        courseData.categories.set(category.id, {
          name: category.name,
          materials: [],
        })
      }
      courseData.categories.get(category.id)!.materials.push(material as unknown as Material)
    } else {
      courseData.uncategorized.push(material as unknown as Material)
    }
  })

  const getFileIcon = (material: Material) => {
    if (material.material_type === 'link') return '🔗'
    const fileType = material.file_type
    if (!fileType) return '📄'
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('word') || fileType.includes('doc')) return '📘'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📗'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎬'
    if (fileType.includes('audio')) return '🎵'
    return '📄'
  }

  const getMaterialUrl = (material: Material) => {
    return material.material_type === 'link' ? material.link_url : material.file_path
  }

  const getMaterialAction = (material: Material) => {
    if (material.material_type === 'link') {
      return (
        <a
          href={material.link_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Apri link
        </a>
      )
    }
    return (
      <a
        href={material.file_path || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Scarica
      </a>
    )
  }

  const renderMaterialCard = (material: Material) => (
    <Card key={material.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl">{getFileIcon(material)}</span>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{material.title}</CardTitle>
              <div className="flex gap-1 mt-1 flex-wrap">
                {material.material_type === 'link' ? (
                  <Badge variant="outline" className="text-xs">Link</Badge>
                ) : material.file_type && (
                  <Badge variant="secondary" className="text-xs">
                    {material.file_type.split('/').pop()?.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DeleteMaterialButton
            materialId={material.id}
            materialTitle={material.title}
            filePath={material.file_path}
          />
        </div>
      </CardHeader>
      <CardContent>
        {material.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {material.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {getMaterialAction(material)}
          <p className="text-xs text-gray-400">
            {new Date(material.created_at).toLocaleDateString('it-IT')}
          </p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Materiali Didattici</h1>
          <p className="text-gray-600">Gestisci dispense, documenti e link per i corsi</p>
        </div>
        <div className="flex gap-2">
          <ManageCategoriesDialog courses={courses || []} />
          <UploadMaterialDialog courses={courses || []} />
        </div>
      </div>

      {/* Materials List by Course and Category */}
      {materialsByCourse.size > 0 ? (
        Array.from(materialsByCourse.entries()).map(([courseId, courseData]) => (
          <div key={courseId} className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">{courseData.name}</h2>

            {/* Categories */}
            {Array.from(courseData.categories.entries()).map(([catId, catData]) => (
              <div key={catId} className="ml-4">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {catData.name}
                  <Badge variant="secondary" className="text-xs">
                    {catData.materials.length} elementi
                  </Badge>
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {catData.materials.map(renderMaterialCard)}
                </div>
              </div>
            ))}

            {/* Uncategorized materials */}
            {courseData.uncategorized.length > 0 && (
              <div className="ml-4">
                {courseData.categories.size > 0 && (
                  <h3 className="text-lg font-medium mb-3 text-gray-500">
                    Senza categoria
                  </h3>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {courseData.uncategorized.map(renderMaterialCard)}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Nessun materiale caricato</p>
            <UploadMaterialDialog courses={courses || []} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
