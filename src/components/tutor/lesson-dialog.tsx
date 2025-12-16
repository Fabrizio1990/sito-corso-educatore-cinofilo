'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { notifyLessonUpdate } from '@/lib/notifications'

const TIME_PRESETS = [
  { label: 'Mattina (09:00 - 12:00)', start: '09:00', end: '12:00' },
  { label: 'Mattina (09:00 - 13:00)', start: '09:00', end: '13:00' },
  { label: 'Pomeriggio (14:00 - 17:00)', start: '14:00', end: '17:00' },
  { label: 'Pomeriggio (14:00 - 18:00)', start: '14:00', end: '18:00' },
  { label: 'Giornata intera (09:00 - 18:00)', start: '09:00', end: '18:00' },
  { label: 'Sera (18:00 - 20:00)', start: '18:00', end: '20:00' },
  { label: 'Sera (19:00 - 21:00)', start: '19:00', end: '21:00' },
]

export interface Lesson {
  id: string
  title: string
  lesson_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  description: string | null
  required_prep: string | null
}

interface LessonDialogProps {
  classId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  // For editing existing lesson
  lesson?: Lesson | null
  // For creating with pre-selected date (from calendar)
  selectedDate?: string | null
}

export function LessonDialog({
  classId,
  open,
  onOpenChange,
  lesson = null,
  selectedDate = null
}: LessonDialogProps) {
  const [title, setTitle] = useState('')
  const [lessonDate, setLessonDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [requiredPrep, setRequiredPrep] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const isEditing = !!lesson

  // Reset/populate form when dialog opens or lesson changes
  useEffect(() => {
    if (open) {
      if (lesson) {
        // Editing mode - populate with lesson data
        setTitle(lesson.title)
        setLessonDate(lesson.lesson_date)
        setStartTime(lesson.start_time || '')
        setEndTime(lesson.end_time || '')
        setLocation(lesson.location || '')
        setDescription(lesson.description || '')
        setRequiredPrep(lesson.required_prep || '')
      } else {
        // Creating mode - reset form
        setTitle('')
        setLessonDate(selectedDate || '')
        setStartTime('')
        setEndTime('')
        setLocation('')
        setDescription('')
        setRequiredPrep('')
      }
      setError(null)
    }
  }, [open, lesson, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isEditing && lesson) {
      // Update existing lesson
      const { error } = await supabase
        .from('lessons')
        .update({
          title,
          lesson_date: lessonDate,
          start_time: startTime || null,
          end_time: endTime || null,
          location: location || null,
          description: description || null,
          required_prep: requiredPrep || null,
        })
        .eq('id', lesson.id)

      if (error) {
        setError(error.message)
        toast.error('Errore nella modifica della lezione')
        setLoading(false)
        return
      }

      // Send notification to students
      notifyLessonUpdate(classId, title)
      toast.success('Lezione modificata con successo')
    } else {
      // Create new lesson
      const { error } = await supabase.from('lessons').insert({
        class_id: classId,
        title,
        lesson_date: lessonDate,
        start_time: startTime || null,
        end_time: endTime || null,
        location: location || null,
        description: description || null,
        required_prep: requiredPrep || null,
      })

      if (error) {
        setError(error.message)
        toast.error('Errore nella creazione della lezione')
        setLoading(false)
        return
      }

      toast.success('Lezione creata con successo')
    }

    setLoading(false)
    onOpenChange(false)
    router.refresh()
  }

  const formatSelectedDate = () => {
    if (!lessonDate) return ''
    return new Date(lessonDate).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifica lezione' : 'Nuova lezione'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? (
                'Modifica le informazioni della lezione'
              ) : selectedDate ? (
                <>Crea una lezione per il <strong>{formatSelectedDate()}</strong></>
              ) : (
                'Aggiungi una nuova lezione al calendario della classe'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="lesson-title">Titolo lezione *</Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Introduzione al clicker training"
                required
              />
            </div>
            {!selectedDate && (
              <div className="grid gap-2">
                <Label htmlFor="lesson-date">Data *</Label>
                <Input
                  id="lesson-date"
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Orario preset</Label>
              <div className="flex flex-wrap gap-2">
                {TIME_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={startTime === preset.start && endTime === preset.end ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setStartTime(preset.start)
                      setEndTime(preset.end)
                    }}
                    className="text-xs"
                  >
                    {preset.start} - {preset.end}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lesson-start-time">Orario inizio</Label>
                <Input
                  id="lesson-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lesson-end-time">Orario fine</Label>
                <Input
                  id="lesson-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lesson-location">Luogo</Label>
              <Input
                id="lesson-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="es. Campo pratica - Via Roma 123"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lesson-description">Descrizione</Label>
              <textarea
                id="lesson-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi brevemente gli argomenti della lezione..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lesson-prep">Cosa portare</Label>
              <textarea
                id="lesson-prep"
                value={requiredPrep}
                onChange={(e) => setRequiredPrep(e.target.value)}
                placeholder="es. Portare il proprio cane, guinzaglio lungo, premi..."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !title || !lessonDate}>
              {loading
                ? (isEditing ? 'Salvataggio...' : 'Creazione...')
                : (isEditing ? 'Salva modifiche' : 'Crea lezione')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
