'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { notifyLessonUpdate } from '@/lib/notifications'

interface EditLessonFormProps {
  lesson: {
    id: string
    title: string
    lesson_date: string
    lesson_time: string | null
    location: string | null
    description: string | null
    required_prep: string | null
  }
  classId: string
}

export function EditLessonForm({ lesson, classId }: EditLessonFormProps) {
  const [title, setTitle] = useState(lesson.title)
  const [lessonDate, setLessonDate] = useState(lesson.lesson_date)
  const [lessonTime, setLessonTime] = useState(lesson.lesson_time || '')
  const [location, setLocation] = useState(lesson.location || '')
  const [description, setDescription] = useState(lesson.description || '')
  const [requiredPrep, setRequiredPrep] = useState(lesson.required_prep || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase
      .from('lessons')
      .update({
        title,
        lesson_date: lessonDate,
        lesson_time: lessonTime || null,
        location: location || null,
        description: description || null,
        required_prep: requiredPrep || null,
      })
      .eq('id', lesson.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Send notification to students (fire and forget)
    notifyLessonUpdate(classId, title)

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
          Lezione aggiornata con successo!
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Titolo lezione *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="es. Introduzione al clicker training"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lessonDate">Data *</Label>
            <Input
              id="lessonDate"
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lessonTime">Orario</Label>
            <Input
              id="lessonTime"
              type="time"
              value={lessonTime}
              onChange={(e) => setLessonTime(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Luogo</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="es. Campo pratica - Via Roma 123"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Descrizione</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrivi brevemente gli argomenti della lezione..."
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="requiredPrep">Cosa portare</Label>
          <textarea
            id="requiredPrep"
            value={requiredPrep}
            onChange={(e) => setRequiredPrep(e.target.value)}
            placeholder="es. Portare il proprio cane, guinzaglio lungo, premi..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/tutor/classes/${classId}/lessons`)}
        >
          Annulla
        </Button>
        <Button type="submit" disabled={loading || !title || !lessonDate}>
          {loading ? 'Salvataggio...' : 'Salva modifiche'}
        </Button>
      </div>
    </form>
  )
}
