'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createAnnouncement, updateAnnouncement } from '@/app/actions/announcements'
import { toast } from 'sonner'
import { Edit, Plus } from 'lucide-react'

interface CreateAnnouncementDialogProps {
  classes: Array<{ id: string; edition_name: string; courses: { name: string } | null }>
  courses: Array<{ id: string; name: string }>
  announcement?: {
    id: string
    title: string
    body: string
    priority: string | null
    class_id: string | null
    course_id: string | null
    pinned: boolean | null
  }
}

export function CreateAnnouncementDialog({ classes, courses, announcement }: CreateAnnouncementDialogProps) {
  const isEditing = !!announcement
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(announcement?.title || '')
  const [body, setBody] = useState(announcement?.body || '')
  const [target, setTarget] = useState(
    announcement?.class_id
      ? `class:${announcement.class_id}`
      : announcement?.course_id
        ? `course:${announcement.course_id}`
        : 'all'
  )
  const [priority, setPriority] = useState(announcement?.priority || 'normal')
  const [pinned, setPinned] = useState(announcement?.pinned || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const resetForm = () => {
    if (!isEditing) {
      setTitle('')
      setBody('')
      setTarget('all')
      setPriority('normal')
      setPinned(false)
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('title', title)
    formData.set('body', body)
    formData.set('priority', priority)
    formData.set('pinned', pinned ? 'true' : 'false')

    if (target.startsWith('class:')) {
      formData.set('class_id', target.replace('class:', ''))
    } else if (target.startsWith('course:')) {
      formData.set('course_id', target.replace('course:', ''))
    }

    const result = isEditing
      ? await updateAnnouncement(announcement!.id, formData)
      : await createAnnouncement(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setOpen(false)
    setLoading(false)
    resetForm()
    toast.success(isEditing ? 'Comunicazione aggiornata' : 'Comunicazione creata')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null) }}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Comunicazione
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifica comunicazione' : 'Nuova comunicazione'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modifica i dettagli della comunicazione'
                : 'Crea una nuova comunicazione per studenti e classi'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Cambio orario lezione"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Messaggio *</Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Scrivi il contenuto della comunicazione..."
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target">Destinatari</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona destinatari" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={`course:${course.id}`} value={`course:${course.id}`}>
                      Corso: {course.name}
                    </SelectItem>
                  ))}
                  {classes.map((cls) => (
                    <SelectItem key={`class:${cls.id}`} value={`class:${cls.id}`}>
                      {cls.courses?.name ? `${cls.courses.name} - ` : ''}{cls.edition_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priorità</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona priorità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="important">Importante</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="pinned"
                checked={pinned}
                onCheckedChange={(checked) => setPinned(checked === true)}
              />
              <Label htmlFor="pinned" className="cursor-pointer">Fissa in alto</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !title || !body}>
              {loading
                ? (isEditing ? 'Salvataggio...' : 'Creazione...')
                : (isEditing ? 'Salva modifiche' : 'Crea comunicazione')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
