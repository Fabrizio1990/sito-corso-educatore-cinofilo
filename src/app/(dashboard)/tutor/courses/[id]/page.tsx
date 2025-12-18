import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { EditCourseForm } from '@/components/tutor/edit-course-form'
import { DeleteCourseButton } from '@/components/tutor/delete-course-button'
import { CreateClassDialog } from '@/components/tutor/create-class-dialog'
import { UploadMaterialDialog } from '@/components/tutor/upload-material-dialog'
import { MaterialCard } from '@/components/tutor/material-card'
import { CategorySorter } from '@/components/tutor/category-sorter'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params
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

  // Get course details with related data
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !course) {
    notFound()
  }

  // Get classes for this course
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      class_students (profile_id)
    `)
    .eq('course_id', id)
    .order('start_date', { ascending: false })

  // Get materials with categories
  const { data: materials } = await supabase
    .from('materials')
    .select(`
      id,
      title,
      description,
      file_path,
      file_type,
      link_url,
      material_type,
      category_id,
      course_id,
      created_at,
      material_categories (id, name, sort_order)
    `)
    .eq('course_id', id)
    .order('created_at', { ascending: false })

  // Get categories for this course
  const { data: categories } = await supabase
    .from('material_categories')
    .select('id, name, sort_order')
    .eq('course_id', id)
    .order('sort_order', { ascending: true })

  // Get quizzes count
  const { count: quizzesCount } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', id)

  const totalStudents = classes?.reduce((acc, c) => {
    return acc + ((c.class_students as { profile_id: string }[])?.length || 0)
  }, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/tutor/courses" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            ← Torna ai corsi
          </Link>
          <h1 className="text-3xl font-bold">{course.name}</h1>
          {course.description && (
            <p className="text-gray-600 mt-2">{course.description}</p>
          )}
        </div>
        <DeleteCourseButton courseId={course.id} courseName={course.name} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{classes?.length || 0}</p>
              <p className="text-gray-500">Classi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalStudents}</p>
              <p className="text-gray-500">Studenti totali</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{materials?.length || 0}</p>
              <p className="text-gray-500">Materiali</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{quizzesCount || 0}</p>
              <p className="text-gray-500">Quiz</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Modifica corso</CardTitle>
          <CardDescription>Aggiorna le informazioni del corso</CardDescription>
        </CardHeader>
        <CardContent>
          <EditCourseForm course={course} />
        </CardContent>
      </Card>

      {/* Classes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Classi del corso</h2>
          <CreateClassDialog
            courses={[{ id: course.id, name: course.name }]}
            preselectedCourseId={course.id}
          />
        </div>
        {classes && classes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.map((classItem) => {
              const studentsCount = (classItem.class_students as { profile_id: string }[])?.length || 0
              const isActive = classItem.end_date ? new Date(classItem.end_date) >= new Date() : true

              return (
                <Link key={classItem.id} href={`/tutor/classes/${classItem.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{classItem.edition_name}</CardTitle>
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {isActive ? 'Attiva' : 'Conclusa'}
                        </Badge>
                      </div>
                      <CardDescription>
                        {studentsCount} studenti iscritti
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {classItem.start_date && (
                        <p className="text-sm text-gray-500">
                          {new Date(classItem.start_date).toLocaleDateString('it-IT')}
                          {classItem.end_date && ` - ${new Date(classItem.end_date).toLocaleDateString('it-IT')}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-gray-500">Nessuna classe per questo corso</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Sorter */}
      {categories && categories.length > 0 && (
        <CategorySorter
          courseId={course.id}
          categories={categories.map(cat => {
            const materialCount = materials?.filter(m => m.category_id === cat.id).length || 0
            return {
              id: cat.id,
              name: cat.name,
              sort_order: cat.sort_order,
              materialCount,
            }
          })}
        />
      )}

      {/* Materials */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Materiali del corso</h2>
          <div className="flex gap-2">
            <UploadMaterialDialog
              courses={[{ id: course.id, name: course.name }]}
              preselectedCourseId={course.id}
            />
            <Link href="/tutor/materials">
              <Button variant="outline">Gestisci</Button>
            </Link>
          </div>
        </div>

        {materials && materials.length > 0 ? (
          <div className="space-y-6">
            {/* Materials by category */}
            {categories && categories.length > 0 && categories.map((category) => {
              const categoryMaterials = materials.filter(m => m.category_id === category.id)
              if (categoryMaterials.length === 0) return null

              return (
                <div key={category.id}>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {category.name}
                    <Badge variant="secondary" className="text-xs">
                      {categoryMaterials.length} elementi
                    </Badge>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryMaterials.map((material) => (
                      <MaterialCard key={material.id} material={material} />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Uncategorized materials */}
            {(() => {
              const uncategorized = materials.filter(m => !m.category_id)
              if (uncategorized.length === 0) return null

              return (
                <div>
                  {categories && categories.length > 0 && (
                    <h3 className="text-lg font-medium mb-3 text-gray-500">Senza argomento</h3>
                  )}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {uncategorized.map((material) => (
                      <MaterialCard key={material.id} material={material} />
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-gray-500 mb-4">Nessun materiale caricato</p>
              <UploadMaterialDialog
                courses={[{ id: course.id, name: course.name }]}
                preselectedCourseId={course.id}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
