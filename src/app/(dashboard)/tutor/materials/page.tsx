import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UploadMaterialDialog } from '@/components/tutor/upload-material-dialog'
import { ManageCategoriesDialog } from '@/components/tutor/manage-categories-dialog'
import { MaterialCard } from '@/components/tutor/material-card'

interface Material {
  id: string
  title: string
  description: string | null
  file_path: string | null
  file_type: string | null
  link_url: string | null
  material_type: string | null
  category_id: string | null
  course_id: string
  created_at: string
  courses: { name: string } | null
  material_categories: { id: string; name: string } | null
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
    const category = material.material_categories as { id: string; name: string } | null

    if (category) {
      if (!courseData.categories.has(category.id)) {
        courseData.categories.set(category.id, {
          name: category.name,
          materials: [],
        })
      }
      courseData.categories.get(category.id)!.materials.push(material as Material)
    } else {
      courseData.uncategorized.push(material as Material)
    }
  })

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
                  {catData.materials.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
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
                  {courseData.uncategorized.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
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
