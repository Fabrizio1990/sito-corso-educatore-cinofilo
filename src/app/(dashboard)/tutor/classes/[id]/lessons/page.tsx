import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CreateLessonButton } from '@/components/tutor/create-lesson-button'
import { LessonsCalendar } from '@/components/tutor/lessons-calendar'
import { LessonsList } from '@/components/tutor/lessons-list'

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

  // Map lessons to the expected format
  const formattedLessons = (lessons || []).map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    lesson_date: lesson.lesson_date,
    start_time: lesson.start_time,
    end_time: lesson.end_time,
    location: lesson.location,
    description: lesson.description,
    required_prep: lesson.required_prep,
  }))

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
        <CreateLessonButton classId={id} />
      </div>

      {/* Calendar View */}
      <LessonsCalendar classId={id} lessons={formattedLessons} />

      {/* Lessons List */}
      <LessonsList classId={id} lessons={formattedLessons} />
    </div>
  )
}
