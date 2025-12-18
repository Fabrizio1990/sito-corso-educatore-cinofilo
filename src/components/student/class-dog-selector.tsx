'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dog } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ClassDogSelectorProps {
  classId: string
  className: string
  dogs: Dog[]
  selectedDogIds: string[]
}

export function ClassDogSelector({ classId, className, dogs, selectedDogIds }: ClassDogSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(selectedDogIds)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleToggle = (dogId: string) => {
    setSelected(prev => {
      if (prev.includes(dogId)) {
        return prev.filter(id => id !== dogId)
      }
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, dogId]
    })
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Devi essere autenticato')
      setLoading(false)
      return
    }

    // Delete existing selections for this class
    await supabase
      .from('class_dogs')
      .delete()
      .eq('class_id', classId)
      .eq('profile_id', user.id)

    // Insert new selections
    if (selected.length > 0) {
      const inserts = selected.map(dogId => ({
        class_id: classId,
        profile_id: user.id,
        dog_id: dogId,
      }))

      const { error: insertError } = await supabase
        .from('class_dogs')
        .insert(inserts)

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  const selectedDogs = dogs.filter(d => selectedDogIds.includes(d.id))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full text-left p-2 rounded-md border hover:bg-gray-50 transition-colors">
          {selectedDogs.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">🐕</span>
              <div className="text-sm">
                <span className="font-medium">{selectedDogs.map(d => d.name).join(', ')}</span>
                <span className="text-gray-500 ml-1">· Modifica</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <span className="text-lg">⚠️</span>
              <span className="text-sm">Seleziona i cani per questo corso</span>
            </div>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cani per {className}</DialogTitle>
          <DialogDescription>
            Seleziona i cani che parteciperanno a questo corso (massimo 2)
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {dogs.length === 0 ? (
          <div className="py-4 text-center text-gray-500">
            <p>Non hai ancora registrato nessun cane.</p>
            <p className="text-sm mt-1">Vai al tuo profilo per aggiungerne uno.</p>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            {dogs.map((dog) => (
              <div
                key={dog.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selected.includes(dog.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => handleToggle(dog.id)}
              >
                <Checkbox
                  id={dog.id}
                  checked={selected.includes(dog.id)}
                  disabled={!selected.includes(dog.id) && selected.length >= 2}
                  onCheckedChange={() => handleToggle(dog.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{dog.name}</p>
                  <p className="text-sm text-gray-500">
                    {dog.breed} · {dog.sex} · {dog.age_years} {dog.age_years === 1 ? 'anno' : 'anni'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={loading || dogs.length === 0}>
            {loading ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
