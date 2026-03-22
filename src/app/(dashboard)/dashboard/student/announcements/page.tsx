import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Megaphone } from 'lucide-react'
import { AnnouncementCard } from '@/components/student/announcement-card'

export default async function StudentAnnouncementsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get enrolled class IDs
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('profile_id', user.id)

  const classIds = enrollments?.map(e => e.class_id) || []

  // Fetch announcements - global ones + ones for enrolled classes
  let announcementsQuery = supabase
    .from('announcements')
    .select('*, profiles!announcements_author_id_fkey(full_name), classes(edition_name, courses(name))')

  if (classIds.length > 0) {
    announcementsQuery = announcementsQuery
      .or(`class_id.is.null,class_id.in.(${classIds.join(',')})`)
  } else {
    // No enrollments: only show global announcements
    announcementsQuery = announcementsQuery.is('class_id', null)
  }

  const { data: announcements } = await announcementsQuery
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  // Fetch read status
  const { data: reads } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('profile_id', user.id)

  const readIds = new Set(reads?.map(r => r.announcement_id) || [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Bacheca</h1>
        <p className="text-muted-foreground">Comunicazioni e novità dal corso</p>
      </div>

      {(!announcements || announcements.length === 0) ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-500">Nessuna comunicazione al momento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              isRead={readIds.has(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
