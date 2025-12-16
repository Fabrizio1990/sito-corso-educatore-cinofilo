'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LessonDialog, Lesson } from './lesson-dialog'

interface LessonsCalendarProps {
  classId: string
  lessons: Lesson[]
}

const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

export function LessonsCalendar({ classId, lessons }: LessonsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  // Get day of week for first day (0 = Sunday, convert to Monday = 0)
  let startDay = firstDayOfMonth.getDay() - 1
  if (startDay < 0) startDay = 6

  // Create calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  // Get lessons for current month
  const getLessonsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return lessons.filter(l => l.lesson_date === dateStr)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    setDialogOpen(true)
  }

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  const isPast = (day: number) => {
    const date = new Date(year, month, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayStart
  }

  const formatTimeRange = (lesson: Lesson) => {
    if (!lesson.start_time) return ''
    const start = lesson.start_time.slice(0, 5)
    const end = lesson.end_time ? lesson.end_time.slice(0, 5) : ''
    return end ? `${start}-${end}` : start
  }

  return (
    <>
      <Card className="p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Oggi
            </Button>
          </div>
          <h3 className="text-lg font-semibold">
            {MONTHS_IT[month]} {year}
          </h3>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_IT.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded" />
            }

            const dayLessons = getLessonsForDay(day)
            const dayIsPast = isPast(day)
            const dayIsToday = isToday(day)

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  h-24 p-1 rounded border cursor-pointer transition-colors overflow-hidden
                  ${dayIsToday ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'}
                  ${dayIsPast && !dayIsToday ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-100'}
                `}
              >
                <div className={`text-sm font-medium mb-1 ${dayIsToday ? 'text-blue-600' : ''}`}>
                  {day}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayLessons.slice(0, 2).map(lesson => (
                    <div
                      key={lesson.id}
                      className={`
                        text-xs px-1 py-0.5 rounded truncate
                        ${dayIsPast ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'}
                      `}
                      title={`${lesson.title}${lesson.start_time ? ` - ${formatTimeRange(lesson)}` : ''}`}
                    >
                      {lesson.start_time && (
                        <span className="font-medium">{formatTimeRange(lesson)} </span>
                      )}
                      {lesson.title}
                    </div>
                  ))}
                  {dayLessons.length > 2 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayLessons.length - 2} altre
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span>Lezione programmata</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-50"></div>
            <span>Oggi</span>
          </div>
        </div>
      </Card>

      {/* Unified Lesson Dialog */}
      <LessonDialog
        classId={classId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
      />
    </>
  )
}
