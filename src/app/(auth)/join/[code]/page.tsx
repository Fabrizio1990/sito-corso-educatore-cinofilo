'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ClassInfo {
  id: string
  edition_name: string
  course_name: string
}

export default function JoinClassPage() {
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false)
  const router = useRouter()
  const params = useParams()
  const inviteCode = params.code as string
  const supabase = createClient()

  useEffect(() => {
    checkClassAndUser()
  }, [inviteCode])

  const checkClassAndUser = async () => {
    setLoading(true)
    setError(null)

    // Check if class exists with this invite code
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        edition_name,
        courses (name)
      `)
      .eq('invite_code', inviteCode)
      .single()

    if (classError || !classData) {
      setError('Codice invito non valido o classe non trovata')
      setLoading(false)
      return
    }

    setClassInfo({
      id: classData.id,
      edition_name: classData.edition_name,
      course_name: (classData.courses as { name: string })?.name || 'Corso',
    })

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setIsLoggedIn(true)

      // Check if already enrolled
      const { data: enrollment } = await supabase
        .from('class_students')
        .select('id')
        .eq('class_id', classData.id)
        .eq('profile_id', user.id)
        .single()

      if (enrollment) {
        setAlreadyEnrolled(true)
      }
    }

    setLoading(false)
  }

  const handleJoinClass = async () => {
    setJoining(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !classInfo) {
      setError('Errore durante l\'iscrizione')
      setJoining(false)
      return
    }

    const { error: enrollError } = await supabase
      .from('class_students')
      .insert({
        class_id: classInfo.id,
        profile_id: user.id,
      })

    if (enrollError) {
      if (enrollError.code === '23505') {
        setAlreadyEnrolled(true)
      } else {
        setError('Errore durante l\'iscrizione: ' + enrollError.message)
      }
      setJoining(false)
      return
    }

    setSuccess(true)
    setJoining(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center">
            <p>Verifica codice invito...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !classInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              Errore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">{error}</p>
          </CardContent>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Torna alla home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              Iscrizione completata!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-2">
              Sei stato iscritto con successo alla classe
            </p>
            <p className="font-semibold">
              {classInfo?.course_name} - {classInfo?.edition_name}
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>
              Vai alla dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (alreadyEnrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-blue-600">
              Sei già iscritto!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-2">
              Fai già parte di questa classe
            </p>
            <p className="font-semibold">
              {classInfo?.course_name} - {classInfo?.edition_name}
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>
              Vai alla dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Iscriviti alla classe
          </CardTitle>
          <CardDescription className="text-center">
            Sei stato invitato a partecipare a
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-lg font-semibold text-blue-900">
              {classInfo?.course_name}
            </p>
            <p className="text-blue-700">
              {classInfo?.edition_name}
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {isLoggedIn ? (
            <Button className="w-full" onClick={handleJoinClass} disabled={joining}>
              {joining ? 'Iscrizione in corso...' : 'Iscriviti alla classe'}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Per iscriverti devi prima accedere o creare un account
              </p>
              <div className="flex gap-2">
                <Link href={`/login?invite=${inviteCode}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Accedi
                  </Button>
                </Link>
                <Link href={`/signup?invite=${inviteCode}`} className="flex-1">
                  <Button className="w-full">
                    Registrati
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
