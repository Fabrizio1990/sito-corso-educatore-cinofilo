import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { EditLessonForm } from '@/components/tutor/edit-lesson-form'

interface PageProps {
  params: Promise<{ id: string; lessonId: string }>
}

export default async function EditLessonPage({ params }: PageProps) {
  const { id, lessonId } = await params
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

  // Get lesson details
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      *,
      classes (
        id,
        edition_name,
        courses (id, name)
      )
    `)
    .eq('id', lessonId)
    .eq('class_id', id)
    .single()

  if (error || !lesson) {
    notFound()
  }

  const classData = lesson.classes as { id: string; edition_name: string; courses: { id: string; name: string } }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/tutor/classes/${id}/lessons`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Torna alle lezioni
        </Link>
        <h1 className="text-3xl font-bold">Modifica Lezione</h1>
        <p className="text-gray-600">{classData?.courses?.name} - {classData?.edition_name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli lezione</CardTitle>
          <CardDescription>Modifica le informazioni della lezione</CardDescription>
        </CardHeader>
        <CardContent>
          <EditLessonForm
            lesson={{
              id: lesson.id,
              title: lesson.title,
              lesson_date: lesson.lesson_date,
              lesson_time: lesson.lesson_time,
              location: lesson.location,
              description: lesson.description,
              required_prep: lesson.required_prep,
            }}
            classId={id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
