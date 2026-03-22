import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AttendanceForm } from '@/components/tutor/attendance-form'

interface PageProps {
  params: Promise<{ id: string; lessonId: string }>
}

export default async function AttendancePage({ params }: PageProps) {
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

  // Get lesson details with class and course info
  const { data: lesson, error: lessonError } = await supabase
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
    .single()

  if (lessonError || !lesson) {
    notFound()
  }

  const classData = lesson.classes as { id: string; edition_name: string; courses: { id: string; name: string } }
  const course = classData.courses

  // Get enrolled students
  const { data: enrolledStudents } = await supabase
    .from('class_students')
    .select('profiles(id, full_name, email)')
    .eq('class_id', classData.id)

  const students = (enrolledStudents || [])
    .map(e => e.profiles as unknown as { id: string; full_name: string; email: string })
    .filter(Boolean)
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

  // Get existing attendance records
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('lesson_id', lessonId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/tutor/classes/${id}/lessons`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Torna alle lezioni
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Presenze</h1>
        <p className="text-gray-600">
          {lesson.title} - {new Date(lesson.lesson_date).toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <p className="text-sm text-gray-500">{course?.name} - {classData.edition_name}</p>
      </div>

      {/* Attendance Form */}
      {students.length > 0 ? (
        <AttendanceForm
          lessonId={lessonId}
          students={students}
          existingAttendance={(existingAttendance || []).map(a => ({
            profile_id: a.profile_id,
            status: a.status,
            notes: a.notes,
          }))}
        />
      ) : (
        <div className="text-center py-10 text-gray-500">
          <p>Nessuno studente iscritto a questa classe.</p>
          <Link href={`/tutor/classes/${id}`}>
            <Button variant="outline" className="mt-4">Vai alla classe</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
