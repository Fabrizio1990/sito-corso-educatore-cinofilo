export interface LessonForICS {
  id: string
  title: string
  lesson_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  description: string | null
  required_prep: string | null
  classes: {
    edition_name: string
    courses: { name: string } | null
  } | null
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function formatDateForICS(date: string, time: string | null): string {
  // date is "YYYY-MM-DD", time is "HH:mm:ss" or null
  const datePart = date.replace(/-/g, '')

  if (!time) {
    return `DTSTART;VALUE=DATE:${datePart}`
  }

  const timePart = time.replace(/:/g, '').substring(0, 6)
  return `DTSTART:${datePart}T${timePart}`
}

function formatEndDateForICS(date: string, time: string | null): string | null {
  if (!time) return null

  const datePart = date.replace(/-/g, '')
  const timePart = time.replace(/:/g, '').substring(0, 6)
  return `DTEND:${datePart}T${timePart}`
}

function buildDescription(lesson: LessonForICS): string {
  const parts: string[] = []

  if (lesson.description) {
    parts.push(lesson.description)
  }

  if (lesson.required_prep) {
    parts.push(`Cosa portare: ${lesson.required_prep}`)
  }

  return parts.length > 0 ? escapeICSText(parts.join('\n\n')) : ''
}

function buildSummary(lesson: LessonForICS): string {
  const courseName = lesson.classes?.courses?.name
  const title = lesson.title || 'Lezione'

  if (courseName) {
    return escapeICSText(`${courseName} - ${title}`)
  }

  return escapeICSText(title)
}

export function generateICS(lessons: LessonForICS[]): string {
  const CRLF = '\r\n'

  const events = lessons.map((lesson) => {
    const lines: string[] = [
      'BEGIN:VEVENT',
      `UID:${lesson.id}@dogtrainerhub`,
      formatDateForICS(lesson.lesson_date, lesson.start_time),
    ]

    const dtEnd = formatEndDateForICS(lesson.lesson_date, lesson.end_time)
    if (dtEnd) {
      lines.push(dtEnd)
    }

    lines.push(`SUMMARY:${buildSummary(lesson)}`)

    const description = buildDescription(lesson)
    if (description) {
      lines.push(`DESCRIPTION:${description}`)
    }

    if (lesson.location) {
      lines.push(`LOCATION:${escapeICSText(lesson.location)}`)
    }

    lines.push('END:VEVENT')

    return lines.join(CRLF)
  })

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dog Trainer Hub//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ]

  return calendar.join(CRLF) + CRLF
}
