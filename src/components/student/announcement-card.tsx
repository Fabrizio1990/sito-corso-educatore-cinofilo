'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pin, AlertTriangle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { markAnnouncementRead } from '@/app/actions/announcements'
import { cn } from '@/lib/utils'

interface AnnouncementCardProps {
  announcement: {
    id: string
    title: string
    body: string
    priority: string | null
    pinned: boolean | null
    created_at: string | null
    profiles: { full_name: string } | null
    classes: { edition_name: string; courses: { name: string } | null } | null
  }
  isRead: boolean
}

const priorityBorderColors: Record<string, string> = {
  urgent: 'border-l-red-500',
  important: 'border-l-yellow-500',
}

export function AnnouncementCard({ announcement, isRead }: AnnouncementCardProps) {
  const markedRef = useRef(false)

  useEffect(() => {
    if (isRead || markedRef.current) return

    const timer = setTimeout(() => {
      markedRef.current = true
      markAnnouncementRead(announcement.id)
    }, 500)

    return () => clearTimeout(timer)
  }, [announcement.id, isRead])

  const priority = announcement.priority || 'normal'
  const borderClass = priorityBorderColors[priority] || 'border-l-transparent'

  const targetLabel = announcement.classes
    ? `${announcement.classes.courses?.name || ''} - ${announcement.classes.edition_name}`
    : 'Tutti'

  return (
    <Card
      className={cn(
        'border-l-4',
        borderClass,
        !isRead && 'bg-blue-50/50'
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {!isRead && (
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
            )}
            <CardTitle className="text-base">{announcement.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {priority === 'urgent' && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Urgente
              </Badge>
            )}
            {priority === 'important' && (
              <Badge className="gap-1 bg-yellow-500 text-white border-transparent">
                <AlertCircle className="h-3 w-3" />
                Importante
              </Badge>
            )}
            {announcement.pinned && (
              <Pin className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{announcement.body}</p>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground gap-3">
        {announcement.profiles?.full_name && (
          <span>{announcement.profiles.full_name}</span>
        )}
        {announcement.created_at && (
          <span>
            {formatDistanceToNow(new Date(announcement.created_at), {
              addSuffix: true,
              locale: it,
            })}
          </span>
        )}
        <Badge variant="outline" className="ml-auto text-xs">
          {targetLabel}
        </Badge>
      </CardFooter>
    </Card>
  )
}
