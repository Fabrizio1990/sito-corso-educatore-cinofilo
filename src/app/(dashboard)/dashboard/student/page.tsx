import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function StudentDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Get enrolled classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select(`
      enrolled_at,
      classes (
        id,
        edition_name,
        start_date,
        end_date,
        courses (
          id,
          name,
          description
        )
      )
    `)
    .eq('profile_id', user.id)

  // Get next lesson from enrolled classes
  const classIds = enrollments?.map(e => (e.classes as { id: string })?.id).filter(Boolean) || []

  let nextLesson = null
  if (classIds.length > 0) {
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
      .gte('lesson_date', new Date().toISOString().split('T')[0])
      .order('lesson_date', { ascending: true })
      .order('lesson_time', { ascending: true })
      .limit(1)

    nextLesson = lessons?.[0]
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ciao, {profile.full_name.split(' ')[0]}!</h1>
        <p className="text-gray-600">Benvenuto nella tua area personale</p>
      </div>

      {/* Next Lesson Card */}
      {nextLesson ? (
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardDescription className="text-blue-100">Prossima lezione</CardDescription>
            <CardTitle className="text-2xl">{nextLesson.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Data e ora</p>
                <p className="font-medium">
                  {new Date(nextLesson.lesson_date).toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                  {nextLesson.lesson_time && ` alle ${nextLesson.lesson_time.slice(0, 5)}`}
                </p>
              </div>
              {nextLesson.location && (
                <div>
                  <p className="text-blue-100 text-sm">Luogo</p>
                  <p className="font-medium">{nextLesson.location}</p>
                </div>
              )}
              <div>
                <p className="text-blue-100 text-sm">Corso</p>
                <p className="font-medium">
                  {(nextLesson.classes as { courses: { name: string } })?.courses?.name}
                </p>
              </div>
            </div>
            {nextLesson.required_prep && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg">
                <p className="text-blue-100 text-sm mb-1">Cosa portare</p>
                <p className="font-medium">{nextLesson.required_prep}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Nessuna lezione in programma</p>
          </CardContent>
        </Card>
      )}

      {/* Enrolled Courses */}
      <div>
        <h2 className="text-xl font-semibold mb-4">I tuoi corsi</h2>
        {enrollments && enrollments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map((enrollment) => {
              const classData = enrollment.classes as {
                id: string
                edition_name: string
                start_date: string | null
                end_date: string | null
                courses: { id: string; name: string; description: string | null }
              }
              const isActive = classData.end_date ? new Date(classData.end_date) >= new Date() : true

              return (
                <Card key={classData.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{classData.courses?.name}</CardTitle>
                        <CardDescription>{classData.edition_name}</CardDescription>
                      </div>
                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'In corso' : 'Concluso'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {classData.courses?.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {classData.courses.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/dashboard/student/lessons?class=${classData.id}`} className="flex-1">
                        <button className="w-full px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
                          Lezioni
                        </button>
                      </Link>
                      <Link href={`/dashboard/student/materials?course=${classData.courses?.id}`} className="flex-1">
                        <button className="w-full px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
                          Materiali
                        </button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500 mb-2">Non sei iscritto a nessun corso</p>
              <p className="text-sm text-gray-400">
                Chiedi al tuo tutor un link di invito per iscriverti a una classe
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/student/lessons">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendario Lezioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">Visualizza tutte le lezioni in programma</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/student/materials">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Materiali Didattici
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">Accedi a dispense e documenti</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/student/quizzes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quiz e Verifiche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">Completa quiz e casi studio</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
