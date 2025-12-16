import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CreateCourseDialog } from '@/components/tutor/create-course-dialog'

export default async function CoursesPage() {
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

  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      classes (id)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Corsi</h1>
          <p className="text-gray-600">Gestisci i tuoi corsi di formazione</p>
        </div>
        <CreateCourseDialog />
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>
                  {(course.classes as { id: string }[])?.length || 0} classi attive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description || 'Nessuna descrizione'}
                </p>
                <Link href={`/tutor/courses/${course.id}`}>
                  <Button variant="outline" size="sm">Gestisci</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Non hai ancora creato nessun corso</p>
            <CreateCourseDialog />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
