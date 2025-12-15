import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function StudentLessonsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get enrolled class IDs
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('profile_id', user.id)

  const classIds = enrollments?.map(e => e.class_id) || []

  if (classIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendario Lezioni</h1>
          <p className="text-gray-600">Tutte le lezioni dei tuoi corsi</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Non sei iscritto a nessun corso</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get all lessons for enrolled classes
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      *,
      classes (
        edition_name,
        courses (name)
      )
    `)
    .in('class_id', classIds)
    .order('lesson_date', { ascending: true })
    .order('lesson_time', { ascending: true })

  const today = new Date().toISOString().split('T')[0]
  const upcomingLessons = lessons?.filter(l => l.lesson_date >= today) || []
  const pastLessons = lessons?.filter(l => l.lesson_date < today) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Calendario Lezioni</h1>
        <p className="text-gray-600">Tutte le lezioni dei tuoi corsi</p>
      </div>

      {/* Upcoming Lessons */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Prossime lezioni</h2>
        {upcomingLessons.length > 0 ? (
          <div className="space-y-4">
            {upcomingLessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{lesson.title}</CardTitle>
                      <CardDescription>
                        {(lesson.classes as { courses: { name: string } })?.courses?.name} - {(lesson.classes as { edition_name: string })?.edition_name}
                      </CardDescription>
                    </div>
                    <Badge>
                      {new Date(lesson.lesson_date).toLocaleDateString('it-IT', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    {lesson.lesson_time && (
                      <div>
                        <p className="text-gray-500">Orario</p>
                        <p className="font-medium">{lesson.lesson_time.slice(0, 5)}</p>
                      </div>
                    )}
                    {lesson.location && (
                      <div>
                        <p className="text-gray-500">Luogo</p>
                        <p className="font-medium">{lesson.location}</p>
                      </div>
                    )}
                  </div>
                  {lesson.description && (
                    <p className="text-gray-600 mt-4">{lesson.description}</p>
                  )}
                  {lesson.required_prep && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium text-sm">Cosa portare:</p>
                      <p className="text-yellow-700">{lesson.required_prep}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-gray-500">Nessuna lezione in programma</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Lessons */}
      {pastLessons.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-600">Lezioni passate</h2>
          <div className="space-y-2">
            {pastLessons.map((lesson) => (
              <Card key={lesson.id} className="bg-gray-50">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-sm text-gray-500">
                        {(lesson.classes as { courses: { name: string } })?.courses?.name}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(lesson.lesson_date).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
