'use client'

import { useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CreateLessonDialogProps {
  classId: string
}

export function CreateLessonDialog({ classId }: CreateLessonDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [lessonDate, setLessonDate] = useState('')
  const [lessonTime, setLessonTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [requiredPrep, setRequiredPrep] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('lessons').insert({
      class_id: classId,
      title,
      lesson_date: lessonDate,
      lesson_time: lessonTime || null,
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

    setOpen(false)
    setTitle('')
    setLessonDate('')
    setLessonTime('')
    setLocation('')
    setDescription('')
    setRequiredPrep('')
    setLoading(false)
    toast.success('Lezione creata con successo')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuova Lezione</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crea nuova lezione</DialogTitle>
            <DialogDescription>
              Aggiungi una nuova lezione al calendario della classe
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
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
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requiredPrep">Cosa portare</Label>
              <textarea
                id="requiredPrep"
                value={requiredPrep}
                onChange={(e) => setRequiredPrep(e.target.value)}
                placeholder="es. Portare il proprio cane, guinzaglio lungo, premi..."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !title || !lessonDate}>
              {loading ? 'Creazione...' : 'Crea lezione'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
