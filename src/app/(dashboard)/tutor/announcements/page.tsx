import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateAnnouncementDialog } from '@/components/tutor/create-announcement-dialog'
import { DeleteAnnouncementButton } from '@/components/tutor/delete-announcement-button'
import { Pin, AlertTriangle, AlertCircle, Megaphone } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

export default async function TutorAnnouncementsPage() {
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

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, profiles!announcements_author_id_fkey(full_name), classes(edition_name, courses(name))')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, edition_name, courses(name)')
    .order('edition_name')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .order('name')

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Urgente</Badge>
      case 'important':
        return <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600"><AlertCircle className="h-3 w-3" /> Importante</Badge>
      default:
        return <Badge variant="secondary" className="gap-1"><Megaphone className="h-3 w-3" /> Normale</Badge>
    }
  }

  const getTargetLabel = (announcement: NonNullable<typeof announcements>[number]) => {
    if (announcement.class_id && announcement.classes) {
      const cls = announcement.classes as { edition_name: string; courses: { name: string } | null }
      return cls.courses?.name ? `${cls.courses.name} - ${cls.edition_name}` : cls.edition_name
    }
    if (announcement.course_id) {
      const course = courses?.find(c => c.id === announcement.course_id)
      return course ? `Corso: ${course.name}` : 'Corso specifico'
    }
    return 'Tutti'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Bacheca Comunicazioni</h1>
          <p className="text-muted-foreground">Gestisci le comunicazioni per studenti e classi</p>
        </div>
        <CreateAnnouncementDialog
          classes={(classes || []) as Array<{ id: string; edition_name: string; courses: { name: string } | null }>}
          courses={courses || []}
        />
      </div>

      {announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const authorProfile = announcement.profiles as { full_name: string } | null

            return (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {announcement.pinned && (
                          <Pin className="h-4 w-4 text-blue-500" />
                        )}
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        {getPriorityBadge(announcement.priority)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Destinatari: {getTargetLabel(announcement)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CreateAnnouncementDialog
                        classes={(classes || []) as Array<{ id: string; edition_name: string; courses: { name: string } | null }>}
                        courses={courses || []}
                        announcement={{
                          id: announcement.id,
                          title: announcement.title,
                          body: announcement.body,
                          priority: announcement.priority,
                          class_id: announcement.class_id,
                          course_id: announcement.course_id,
                          pinned: announcement.pinned,
                        }}
                      />
                      <DeleteAnnouncementButton
                        announcementId={announcement.id}
                        announcementTitle={announcement.title}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{announcement.body}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    {authorProfile?.full_name || 'Autore sconosciuto'} - {format(new Date(announcement.created_at!), 'd MMMM yyyy, HH:mm', { locale: it })}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Nessuna comunicazione presente</p>
            <CreateAnnouncementDialog
              classes={(classes || []) as Array<{ id: string; edition_name: string; courses: { name: string } | null }>}
              courses={courses || []}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
