'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteLessonButton } from './delete-lesson-button'
import { LessonDialog, Lesson } from './lesson-dialog'

interface LessonsListProps {
  classId: string
  lessons: Lesson[]
}

export function LessonsList({ classId, lessons }: LessonsListProps) {
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setDialogOpen(true)
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-4">Elenco lezioni</h2>
        {lessons.length > 0 ? (
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const isPast = lesson.lesson_date < today
              const isToday = lesson.lesson_date === today

              return (
                <Card key={lesson.id} className={isPast ? 'bg-gray-50' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{lesson.title}</CardTitle>
                          {isToday && <Badge variant="default">Oggi</Badge>}
                          {isPast && <Badge variant="secondary">Passata</Badge>}
                        </div>
                        <CardDescription>
                          {new Date(lesson.lesson_date).toLocaleDateString('it-IT', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                          {lesson.start_time && (
                            <>
                              {' dalle '}
                              {lesson.start_time.slice(0, 5)}
                              {lesson.end_time && ` alle ${lesson.end_time.slice(0, 5)}`}
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(lesson)}
                        >
                          Modifica
                        </Button>
                        <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {lesson.location && (
                        <div>
                          <p className="text-sm text-gray-500">Luogo</p>
                          <p className="font-medium">{lesson.location}</p>
                        </div>
                      )}
                      {lesson.description && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">Descrizione</p>
                          <p>{lesson.description}</p>
                        </div>
                      )}
                      {lesson.required_prep && (
                        <div className="md:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 font-medium">Cosa portare:</p>
                          <p className="text-yellow-700">{lesson.required_prep}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500 mb-4">Nessuna lezione ancora creata per questa classe</p>
              <p className="text-sm text-gray-400">Clicca su un giorno nel calendario per aggiungere una lezione</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Lesson Dialog */}
      <LessonDialog
        classId={classId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lesson={editingLesson}
      />
    </>
  )
}
