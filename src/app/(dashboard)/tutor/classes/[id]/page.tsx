import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CopyInviteCode } from '@/components/tutor/copy-invite-code'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClassDetailPage({ params }: PageProps) {
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
      courses (id, name, description),
      class_students (
        enrolled_at,
        profiles (id, full_name, email)
      )
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

  const students = (classData.class_students as { enrolled_at: string; profiles: { id: string; full_name: string; email: string } }[]) || []
  const course = classData.courses as { id: string; name: string; description: string | null }
  const isActive = classData.end_date ? new Date(classData.end_date) >= new Date() : true

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{classData.edition_name}</h1>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Attiva' : 'Conclusa'}
            </Badge>
          </div>
          <p className="text-gray-600">{course?.name}</p>
        </div>
        <Link href="/tutor/classes">
          <Button variant="outline">Torna alle classi</Button>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Studenti iscritti</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lezioni</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lessons?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Periodo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {classData.start_date ? new Date(classData.start_date).toLocaleDateString('it-IT') : 'N/D'}
              {' - '}
              {classData.end_date ? new Date(classData.end_date).toLocaleDateString('it-IT') : 'N/D'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invite Code */}
      <Card>
        <CardHeader>
          <CardTitle>Link Invito</CardTitle>
          <CardDescription>Condividi questo link per invitare studenti alla classe</CardDescription>
        </CardHeader>
        <CardContent>
          <CopyInviteCode inviteCode={classData.invite_code || ''} />
        </CardContent>
      </Card>

      {/* Lessons Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lezioni</CardTitle>
            <CardDescription>Gestisci le lezioni di questa classe</CardDescription>
          </div>
          <Link href={`/tutor/classes/${id}/lessons`}>
            <Button>Gestisci Lezioni</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {lessons && lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.slice(0, 5).map((lesson) => (
                <div key={lesson.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(lesson.lesson_date).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                      {lesson.start_time && (
                        <>
                          {' dalle '}
                          {lesson.start_time.slice(0, 5)}
                          {lesson.end_time && ` alle ${lesson.end_time.slice(0, 5)}`}
                        </>
                      )}
                    </p>
                  </div>
                  {lesson.location && (
                    <span className="text-sm text-gray-500">{lesson.location}</span>
                  )}
                </div>
              ))}
              {lessons.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  E altre {lessons.length - 5} lezioni...
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nessuna lezione ancora creata</p>
          )}
        </CardContent>
      </Card>

      {/* Students Section */}
      <Card>
        <CardHeader>
          <CardTitle>Studenti Iscritti</CardTitle>
          <CardDescription>{students.length} studenti in questa classe</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="space-y-2">
              {students.map((enrollment) => (
                <div key={enrollment.profiles.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{enrollment.profiles.full_name}</p>
                    <p className="text-sm text-gray-500">{enrollment.profiles.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    Iscritto il {new Date(enrollment.enrolled_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nessuno studente iscritto</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
