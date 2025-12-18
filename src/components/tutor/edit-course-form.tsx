'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner' // Assuming toast is desired here too

interface EditCourseFormProps {
  course: {
    id: string
    name: string
    description: string | null
  }
}

export function EditCourseForm({ course }: EditCourseFormProps) {
  const [name, setName] = useState(course.name)
  const [description, setDescription] = useState(course.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [tutors, setTutors] = useState<{ id: string, full_name: string }[]>([])
  const [assignedTutors, setAssignedTutors] = useState<string[]>([])
  const [initialAssignedTutors, setInitialAssignedTutors] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user?.id || null)

      // 2. Get all tutors
      const { data: allTutors } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['tutor', 'admin'])
        .order('full_name')

      if (allTutors) setTutors(allTutors)

      // 3. Get currently assigned tutors
      const { data: currentTutors } = await supabase
        .from('course_tutors')
        .select('tutor_id')
        .eq('course_id', course.id)

      if (currentTutors) {
        const ids = currentTutors.map(ct => ct.tutor_id)
        setAssignedTutors(ids)
        setInitialAssignedTutors(ids)
      }
    }
    fetchData()
  }, [course.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (assignedTutors.length === 0) {
      setError('Devi mantenere almeno un tutor assegnato al corso.')
      setLoading(false)
      return
    }

    // Update course details
    const { error: courseError } = await supabase
      .from('courses')
      .update({
        name,
        description: description || null,
      })
      .eq('id', course.id)

    if (courseError) {
      setError(courseError.message)
      setLoading(false)
      return
    }

    // Update tutors
    // Find added and removed
    const toAdd = assignedTutors.filter(id => !initialAssignedTutors.includes(id))
    const toRemove = initialAssignedTutors.filter(id => !assignedTutors.includes(id))

    if (toAdd.length > 0) {
      const { error: addError } = await supabase
        .from('course_tutors')
        .insert(toAdd.map(tutorId => ({ course_id: course.id, tutor_id: tutorId })))

      if (addError) {
        setError('Errore aggiornamento tutor (aggiunta): ' + addError.message)
        setLoading(false)
        return
      }
    }

    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('course_tutors')
        .delete()
        .eq('course_id', course.id)
        .in('tutor_id', toRemove)

      if (removeError) {
        setError('Errore aggiornamento tutor (rimozione): ' + removeError.message)
        setLoading(false)
        return
      }
    }

    // Refresh state
    setInitialAssignedTutors(assignedTutors)
    toast.success('Corso aggiornato con successo')
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
          Corso aggiornato con successo!
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome corso *</Label>
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
            placeholder="Descrizione del corso..."
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>


        <div className="grid gap-2">
          <Label>Gestione Tutors *</Label>
          <div className="border rounded-md p-3 h-[150px] overflow-y-auto">
            <div className="space-y-3">
              {tutors.map((tutor) => (
                <div key={tutor.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-tutor-${tutor.id}`}
                    checked={assignedTutors.includes(tutor.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAssignedTutors([...assignedTutors, tutor.id])
                      } else {
                        if (assignedTutors.length <= 1 && assignedTutors.includes(tutor.id)) {
                          toast.error("Non puoi rimuovere l'ultimo tutor.")
                          return
                        }
                        setAssignedTutors(assignedTutors.filter(id => id !== tutor.id))
                      }
                    }}
                  />
                  <Label
                    htmlFor={`edit-tutor-${tutor.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {tutor.full_name} {currentUser === tutor.id && '(Tu)'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Deve esserci sempre almeno un tutor assegnato.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading || !name}>
          {loading ? 'Salvataggio...' : 'Salva modifiche'}
        </Button>
      </div>
    </form>
  )
}
