import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CreateLessonDialog } from '@/components/tutor/create-lesson-dialog'
import { DeleteLessonButton } from '@/components/tutor/delete-lesson-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClassLessonsPage({ params }: PageProps) {
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

  // Get class details
  const { data: classData, error } = await supabase
    .from('classes')
    .select(`
      *,
      courses (id, name)
    `)
    .eq('id', id)
    .single()

  if (error || !classData) {
    notFound()
  }

  // Get lessons for this class
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('class_id', id)
    .order('lesson_date', { ascending: true })

  const course = classData.courses as { id: string; name: string }
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href={`/tutor/classes/${id}`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            ← Torna alla classe
          </Link>
          <h1 className="text-3xl font-bold">Lezioni</h1>
          <p className="text-gray-600">{course?.name} - {classData.edition_name}</p>
        </div>
        <CreateLessonDialog classId={id} />
      </div>

      {/* Lessons List */}
      {lessons && lessons.length > 0 ? (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const isPast = lesson.lesson_date < today
            const isToday = lesson.lesson_date === today

            return (
              <Card key={lesson.id} className={isPast ? 'bg-gray-50' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        {isToday && <Badge variant="default">Oggi</Badge>}
                        {isPast && <Badge variant="secondary">Passata</Badge>}
                      </div>
                      <CardDescription>
                        {new Date(lesson.lesson_date).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {lesson.lesson_time && ` alle ${lesson.lesson_time.slice(0, 5)}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/tutor/classes/${id}/lessons/${lesson.id}/edit`}>
                        <Button variant="outline" size="sm">Modifica</Button>
                      </Link>
                      <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {lesson.location && (
                      <div>
                        <p className="text-sm text-gray-500">Luogo</p>
                        <p className="font-medium">{lesson.location}</p>
                      </div>
                    )}
                    {lesson.description && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Descrizione</p>
                        <p>{lesson.description}</p>
                      </div>
                    )}
                    {lesson.required_prep && (
                      <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 font-medium">Cosa portare:</p>
                        <p className="text-yellow-700">{lesson.required_prep}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Nessuna lezione ancora creata per questa classe</p>
            <CreateLessonDialog classId={id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
