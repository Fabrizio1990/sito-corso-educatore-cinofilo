import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function StudentMaterialsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get enrolled courses through classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select(`
      classes (
        courses (id, name)
      )
    `)
    .eq('profile_id', user.id)

  const courseIds = enrollments
    ? [...new Set(
        enrollments.map(e => (e.classes as { courses: { id: string } })?.courses?.id).filter(Boolean)
      )]
    : []

  if (courseIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Materiali Didattici</h1>
          <p className="text-gray-600">Dispense e documenti dei tuoi corsi</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Non sei iscritto a nessun corso</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get all materials for enrolled courses
  const { data: materials } = await supabase
    .from('materials')
    .select(`
      *,
      courses (name)
    `)
    .in('course_id', courseIds)
    .order('created_at', { ascending: false })

  // Group materials by course
  const materialsByCourse = materials?.reduce((acc, material) => {
    const courseName = (material.courses as { name: string })?.name || 'Altro'
    if (!acc[courseName]) {
      acc[courseName] = []
    }
    acc[courseName].push(material)
    return acc
  }, {} as Record<string, typeof materials>)

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return '📄'
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('word') || fileType.includes('doc')) return '📘'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📗'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎬'
    return '📄'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Materiali Didattici</h1>
        <p className="text-gray-600">Dispense e documenti dei tuoi corsi</p>
      </div>

      {materialsByCourse && Object.keys(materialsByCourse).length > 0 ? (
        Object.entries(materialsByCourse).map(([courseName, courseMaterials]) => (
          <div key={courseName}>
            <h2 className="text-xl font-semibold mb-4">{courseName}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courseMaterials?.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getFileIcon(material.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{material.title}</CardTitle>
                        {material.file_type && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {material.file_type.split('/').pop()?.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {material.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {material.description}
                      </p>
                    )}
                    <a
                      href={material.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Scarica
                    </a>
                    <p className="text-xs text-gray-400 mt-2">
                      Aggiunto il {new Date(material.created_at!).toLocaleDateString('it-IT')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Nessun materiale disponibile</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
