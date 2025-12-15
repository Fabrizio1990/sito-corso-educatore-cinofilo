import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CreateClassDialog } from '@/components/tutor/create-class-dialog'
import { CopyInviteCode } from '@/components/tutor/copy-invite-code'

export default async function ClassesPage() {
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

  // Get courses for the dropdown
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .order('name')

  // Get classes with related data
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      courses (name),
      class_students (profile_id)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Classi</h1>
          <p className="text-gray-600">Gestisci le edizioni dei tuoi corsi</p>
        </div>
        <CreateClassDialog courses={courses || []} />
      </div>

      {classes && classes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => {
            const studentCount = (classItem.class_students as { profile_id: string }[])?.length || 0
            const isActive = classItem.end_date ? new Date(classItem.end_date) >= new Date() : true

            return (
              <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{classItem.edition_name}</CardTitle>
                      <CardDescription>
                        {(classItem.courses as { name: string })?.name}
                      </CardDescription>
                    </div>
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {isActive ? 'Attiva' : 'Conclusa'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Studenti iscritti</span>
                      <span className="font-medium">{studentCount}</span>
                    </div>
                    {classItem.start_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Inizio</span>
                        <span>{new Date(classItem.start_date).toLocaleDateString('it-IT')}</span>
                      </div>
                    )}
                    {classItem.end_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Fine</span>
                        <span>{new Date(classItem.end_date).toLocaleDateString('it-IT')}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Codice Invito</p>
                      <CopyInviteCode inviteCode={classItem.invite_code || ''} />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={`/tutor/classes/${classItem.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Dettagli</Button>
                      </Link>
                      <Link href={`/tutor/classes/${classItem.id}/lessons`} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full">Lezioni</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Non hai ancora creato nessuna classe</p>
            {courses && courses.length > 0 ? (
              <CreateClassDialog courses={courses} />
            ) : (
              <div>
                <p className="text-gray-400 text-sm mb-4">Devi prima creare un corso</p>
                <Link href="/tutor/courses">
                  <Button>Crea un corso</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
