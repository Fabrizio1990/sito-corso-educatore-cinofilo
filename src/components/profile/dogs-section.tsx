'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dog } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface DogsSectionProps {
  dogs: Dog[]
}

interface DogFormData {
  name: string
  sex: string
  breed: string
  age_years: string
}

const initialFormData: DogFormData = {
  name: '',
  sex: '',
  breed: '',
  age_years: '',
}

export function DogsSection({ dogs }: DogsSectionProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDog, setEditingDog] = useState<Dog | null>(null)
  const [deletingDog, setDeletingDog] = useState<Dog | null>(null)
  const [formData, setFormData] = useState<DogFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const resetForm = () => {
    setFormData(initialFormData)
    setError(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const handleOpenEdit = (dog: Dog) => {
    setFormData({
      name: dog.name,
      sex: dog.sex,
      breed: dog.breed,
      age_years: dog.age_years.toString(),
    })
    setError(null)
    setEditingDog(dog)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      sex: value
    }))
  }

  const handleAddDog = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Devi essere autenticato')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('dogs').insert({
      profile_id: user.id,
      name: formData.name,
      sex: formData.sex,
      breed: formData.breed,
      age_years: parseInt(formData.age_years),
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setIsAddOpen(false)
    resetForm()
    router.refresh()
  }

  const handleEditDog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDog) return

    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('dogs')
      .update({
        name: formData.name,
        sex: formData.sex,
        breed: formData.breed,
        age_years: parseInt(formData.age_years),
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingDog.id)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setEditingDog(null)
    resetForm()
    router.refresh()
  }

  const handleDeleteDog = async () => {
    if (!deletingDog) return

    setLoading(true)

    const { error } = await supabase
      .from('dogs')
      .delete()
      .eq('id', deletingDog.id)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setDeletingDog(null)
    router.refresh()
  }

  const handleCloseDialog = () => {
    setIsAddOpen(false)
    setEditingDog(null)
    resetForm()
  }

  // Form fields - rendered inline to avoid re-creation
  const formFields = (
    <>
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dog-name">Nome del cane *</Label>
        <Input
          id="dog-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Es. Fido"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dog-sex">Sesso *</Label>
        <Select
          value={formData.sex}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id="dog-sex">
            <SelectValue placeholder="Seleziona il sesso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="maschio">Maschio</SelectItem>
            <SelectItem value="femmina">Femmina</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dog-breed">Razza *</Label>
        <Input
          id="dog-breed"
          name="breed"
          value={formData.breed}
          onChange={handleChange}
          placeholder="Es. Labrador Retriever"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dog-age">Età (anni) *</Label>
        <Input
          id="dog-age"
          name="age_years"
          type="number"
          min="0"
          max="30"
          value={formData.age_years}
          onChange={handleChange}
          placeholder="Es. 3"
          required
        />
      </div>
    </>
  )

  return (
    <div className="space-y-4">
      {dogs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Non hai ancora aggiunto nessun cane</p>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog()
            else setIsAddOpen(true)
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}>Aggiungi il tuo primo cane</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiungi un cane</DialogTitle>
                <DialogDescription>
                  Inserisci i dati del tuo cane. Potrai selezionarlo quando ti iscrivi a un corso.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDog} className="space-y-4">
                {formFields}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={loading || !formData.sex}>
                    {loading ? 'Salvataggio...' : 'Aggiungi cane'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {dogs.map((dog) => (
              <div
                key={dog.id}
                className="p-4 border rounded-lg bg-white hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{dog.name}</h3>
                    <p className="text-gray-600">{dog.breed}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span className="capitalize">{dog.sex}</span>
                      <span>{dog.age_years} {dog.age_years === 1 ? 'anno' : 'anni'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={editingDog?.id === dog.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingDog(null)
                        resetForm()
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(dog)}
                        >
                          Modifica
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifica {dog.name}</DialogTitle>
                          <DialogDescription>
                            Modifica i dati del tuo cane.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditDog} className="space-y-4">
                          {formFields}
                          <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => {
                              setEditingDog(null)
                              resetForm()
                            }}>
                              Annulla
                            </Button>
                            <Button type="submit" disabled={loading || !formData.sex}>
                              {loading ? 'Salvataggio...' : 'Salva modifiche'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={deletingDog?.id === dog.id} onOpenChange={(open) => !open && setDeletingDog(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingDog(dog)}
                        >
                          Elimina
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Elimina {dog.name}</DialogTitle>
                          <DialogDescription>
                            Sei sicuro di voler eliminare {dog.name}? Questa azione non può essere annullata.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setDeletingDog(null)}
                          >
                            Annulla
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteDog}
                            disabled={loading}
                          >
                            {loading ? 'Eliminazione...' : 'Elimina'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Dialog open={isAddOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog()
            else setIsAddOpen(true)
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleOpenAdd}>
                + Aggiungi un altro cane
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiungi un cane</DialogTitle>
                <DialogDescription>
                  Inserisci i dati del tuo cane. Potrai selezionarlo quando ti iscrivi a un corso.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDog} className="space-y-4">
                {formFields}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={loading || !formData.sex}>
                    {loading ? 'Salvataggio...' : 'Aggiungi cane'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
