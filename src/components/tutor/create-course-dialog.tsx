'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreateCourseDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tutors, setTutors] = useState<{ id: string, full_name: string }[]>([])
  const [selectedTutors, setSelectedTutors] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchTutors() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user?.id || null)

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['tutor', 'admin'])
        .order('full_name')

      if (data) {
        setTutors(data)
        // Pre-select current user if found
        if (user?.id) {
          setSelectedTutors([user.id])
        }
      }
    }
    if (open) {
      fetchTutors()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: course, error: insertError } = await supabase
      .from('courses')
      .insert({
        name,
        description,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Assign tutors
    if (selectedTutors.length > 0) {
      const tutorInserts = selectedTutors.map(tutorId => ({
        course_id: course.id,
        tutor_id: tutorId
      }))

      const { error: tutorsError } = await supabase
        .from('course_tutors')
        .insert(tutorInserts)

      if (tutorsError) {
        setError('Corso creato ma errore nell\'assegnazione tutor: ' + tutorsError.message)
        // Don't return, let it close so they can see the course (even if imperfect)
      }
    } else {
      setError('Devi selezionare almeno un tutor')
      setLoading(false)
      return
    }

    toast.success('Corso creato con successo')
    setOpen(false)
    setName('')
    setDescription('')
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuovo Corso</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crea nuovo corso</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del nuovo corso di formazione
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome del corso</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Educatore Cinofilo Base"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi il corso..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid gap-2">
              <Label>Tutors del corso *</Label>
              <div className="border rounded-md p-3 h-[150px] overflow-y-auto">
                <div className="space-y-3">
                  {tutors.map((tutor) => (
                    <div key={tutor.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tutor-${tutor.id}`}
                        checked={selectedTutors.includes(tutor.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTutors([...selectedTutors, tutor.id])
                          } else {
                            setSelectedTutors(selectedTutors.filter(id => id !== tutor.id))
                          }
                        }}
                      />
                      <Label
                        htmlFor={`tutor-${tutor.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tutor.full_name} {currentUser === tutor.id && '(Tu)'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Seleziona almeno un tutor.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creazione...' : 'Crea corso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
