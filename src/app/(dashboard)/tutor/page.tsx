import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function TutorDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'tutor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  // Get stats
  const [coursesResult, classesResult, studentsResult, lessonsResult] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }),
    supabase.from('classes').select('id', { count: 'exact' }),
    supabase.from('class_students').select('profile_id', { count: 'exact' }),
    supabase.from('lessons').select('id', { count: 'exact' }),
  ])

  const stats = [
    { label: 'Corsi', value: coursesResult.count || 0, href: '/tutor/courses' },
    { label: 'Classi', value: classesResult.count || 0, href: '/tutor/classes' },
    { label: 'Studenti Iscritti', value: studentsResult.count || 0, href: '/tutor/classes' },
    { label: 'Lezioni', value: lessonsResult.count || 0, href: '/tutor/lessons' },
  ]

  // Get upcoming lessons
  const { data: upcomingLessons } = await supabase
    .from('lessons')
    .select(`
      *,
      classes (
        edition_name,
        courses (name)
      )
    `)
    .gte('lesson_date', new Date().toISOString().split('T')[0])
    .order('lesson_date', { ascending: true })
    .limit(5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Tutor</h1>
        <p className="text-gray-600">Benvenuto, {profile.full_name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prossime Lezioni</CardTitle>
            <CardDescription>Le prossime 5 lezioni in programma</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingLessons && upcomingLessons.length > 0 ? (
              <ul className="space-y-4">
                {upcomingLessons.map((lesson) => (
                  <li key={lesson.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-sm text-gray-500">
                        {(lesson.classes as { edition_name: string; courses: { name: string } })?.courses?.name} - {(lesson.classes as { edition_name: string })?.edition_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(lesson.lesson_date).toLocaleDateString('it-IT', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      {lesson.lesson_time && (
                        <p className="text-sm text-gray-500">{lesson.lesson_time.slice(0, 5)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nessuna lezione in programma</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
            <CardDescription>Gestisci i tuoi corsi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/tutor/courses" className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <p className="font-medium">Gestisci Corsi</p>
              <p className="text-sm text-gray-500">Crea e modifica corsi</p>
            </Link>
            <Link href="/tutor/classes" className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <p className="font-medium">Gestisci Classi</p>
              <p className="text-sm text-gray-500">Crea edizioni e invita studenti</p>
            </Link>
            <Link href="/tutor/materials" className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <p className="font-medium">Carica Materiali</p>
              <p className="text-sm text-gray-500">Aggiungi dispense e documenti</p>
            </Link>
            <Link href="/tutor/quizzes" className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <p className="font-medium">Gestisci Quiz</p>
              <p className="text-sm text-gray-500">Crea quiz e rivedi risposte</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
