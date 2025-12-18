'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    birth_date: profile.birth_date || '',
    city: profile.city || '',
    phone: profile.phone || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Update full_name based on first_name and last_name
    const full_name = `${formData.first_name} ${formData.last_name}`.trim() || profile.full_name

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        birth_date: formData.birth_date || null,
        city: formData.city || null,
        phone: formData.phone || null,
        full_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    router.refresh()

    // Hide success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000)
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
          Profilo aggiornato con successo!
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nome *</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Il tuo nome"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Cognome *</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Il tuo cognome"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data di nascita *</Label>
          <Input
            id="birth_date"
            name="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Comune di residenza *</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Es. Milano"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Numero di telefono *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Es. +39 333 1234567"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          value={profile.email}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">L'email non può essere modificata</p>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Salvataggio...' : 'Salva modifiche'}
      </Button>
    </form>
  )
}
