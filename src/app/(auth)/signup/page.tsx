'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback${inviteCode ? `?invite=${inviteCode}` : ''}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            Registrazione completata!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">
            Ti abbiamo inviato un&apos;email di conferma. Clicca sul link per attivare il tuo account.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Torna al login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Registrati</CardTitle>
        <CardDescription className="text-center">
          Crea il tuo account per accedere ai corsi
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          {inviteCode && (
            <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-md">
              Stai usando un codice invito per iscriverti a una classe
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Mario Rossi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nome@esempio.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 6 caratteri"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </Button>
          <p className="text-sm text-center text-gray-600">
            Hai già un account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Accedi
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center">
            <p>Caricamento...</p>
          </CardContent>
        </Card>
      }>
        <SignupForm />
      </Suspense>
    </div>
  )
}
