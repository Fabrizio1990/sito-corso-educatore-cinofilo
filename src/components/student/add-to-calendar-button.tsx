'use client'

import { Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AddToCalendarButtonProps {
  lesson: {
    id: string
    title: string
    lesson_date: string
    start_time: string | null
    end_time: string | null
    location: string | null
    description: string | null
  }
  courseName?: string
  variant?: 'icon' | 'button'
  className?: string
}

function formatDateTimeForGoogle(date: string, time: string | null): string {
  const datePart = date.replace(/-/g, '')
  if (!time) return datePart

  const timePart = time.replace(/:/g, '').slice(0, 6)
  return `${datePart}T${timePart}`
}

function buildGoogleCalendarUrl(
  lesson: AddToCalendarButtonProps['lesson'],
  courseName?: string
): string {
  const title = courseName
    ? `${courseName} - ${lesson.title}`
    : lesson.title

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
  })

  if (lesson.start_time && lesson.end_time) {
    const start = formatDateTimeForGoogle(lesson.lesson_date, lesson.start_time)
    const end = formatDateTimeForGoogle(lesson.lesson_date, lesson.end_time)
    params.set('dates', `${start}/${end}`)
  } else {
    const startDate = lesson.lesson_date.replace(/-/g, '')
    const nextDay = new Date(lesson.lesson_date)
    nextDay.setDate(nextDay.getDate() + 1)
    const endDate = nextDay.toISOString().slice(0, 10).replace(/-/g, '')
    params.set('dates', `${startDate}/${endDate}`)
  }

  if (lesson.location) {
    params.set('location', lesson.location)
  }

  if (lesson.description) {
    params.set('details', lesson.description)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function AddToCalendarButton({
  lesson,
  courseName,
  variant = 'icon',
  className,
}: AddToCalendarButtonProps) {
  const googleUrl = buildGoogleCalendarUrl(lesson, courseName)
  const icsUrl = `/api/calendar/lesson/${lesson.id}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="sm" className={cn('h-8 w-8 p-0', className)}>
            <Calendar className="h-4 w-4" />
            <span className="sr-only">Aggiungi al calendario</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className={cn('gap-2', className)}>
            <Calendar className="h-4 w-4" />
            Aggiungi al calendario
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H5.684v5.684h12.632zM0 18.316h5.684V5.684H0v12.632zM5.684 24H0v-5.684h5.684V24zM24 0h-5.684v5.684H24V0zM24 18.316h-5.684V24H24v-5.684zM0 0v5.684h5.684V0H0z" />
            </svg>
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={icsUrl} download>
            <Download className="h-4 w-4" />
            Scarica .ics
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
