import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CaseStudyAttemptsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'tutor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  // Get case study details
  const { data: caseStudy, error } = await supabase
    .from('case_studies')
    .select(`
      *,
      courses (name)
    `)
    .eq('id', id)
    .single()

  if (error || !caseStudy) {
    notFound()
  }

  // Get all attempts for this case study
  const { data: attempts } = await supabase
    .from('case_study_attempts')
    .select(`
      *,
      profiles (full_name, email)
    `)
    .eq('case_study_id', id)
    .order('created_at', { ascending: false })

  // Group attempts by student
  type AttemptWithProfile = NonNullable<typeof attempts>[number]
  const attemptsByStudent = (attempts || []).reduce((acc, attempt) => {
    const studentId = attempt.profile_id
    if (!acc[studentId]) {
      acc[studentId] = {
        profile: attempt.profiles as { full_name: string; email: string },
        attempts: [] as AttemptWithProfile[]
      }
    }
    acc[studentId].attempts.push(attempt)
    return acc
  }, {} as Record<string, { profile: { full_name: string; email: string }; attempts: AttemptWithProfile[] }>)

  const totalAttempts = attempts?.length || 0
  const correctAttempts = attempts?.filter(a => a.is_correct).length || 0
  const studentsCount = Object.keys(attemptsByStudent).length
  const studentsCompleted = Object.values(attemptsByStudent).filter(
    s => s.attempts.some(a => a.is_correct)
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/tutor/case-studies" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Torna ai casi di studio
        </Link>
        <h1 className="text-3xl font-bold">{caseStudy.title}</h1>
        <p className="text-gray-600">{(caseStudy.courses as { name: string })?.name}</p>
      </div>

      {/* Scenario Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.scenario}</p>
        </CardContent>
      </Card>

      {/* Model Answer Card (only for tutor) */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-lg text-green-800">Risposta Modello</CardTitle>
          <CardDescription className="text-green-600">Visibile solo ai tutor</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 whitespace-pre-wrap">{caseStudy.model_answer}</p>
          {caseStudy.hints && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-green-600 mb-1">Suggerimenti:</p>
              <p className="text-green-700 whitespace-pre-wrap">{caseStudy.hints}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{studentsCount}</p>
              <p className="text-gray-500">Studenti</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{studentsCompleted}</p>
              <p className="text-gray-500">Completati</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalAttempts}</p>
              <p className="text-gray-500">Tentativi totali</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{correctAttempts}</p>
              <p className="text-gray-500">Risposte corrette</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempts by Student */}
      {Object.entries(attemptsByStudent).length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Tentativi per studente</h2>
          {Object.entries(attemptsByStudent).map(([studentId, data]) => {
            const hasCorrect = data.attempts.some(a => a.is_correct)
            return (
              <Card key={studentId} className={hasCorrect ? 'border-green-200' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{data.profile?.full_name}</CardTitle>
                      <CardDescription>{data.profile?.email}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{data.attempts.length} tentativi</Badge>
                      {hasCorrect ? (
                        <Badge className="bg-green-100 text-green-800">Completato</Badge>
                      ) : (
                        <Badge variant="secondary">In corso</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.attempts.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className={`p-4 rounded-lg border ${
                          attempt.is_correct
                            ? 'border-green-200 bg-green-50/50'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">
                            Tentativo #{attempt.attempt_number}
                          </span>
                          <div className="flex items-center gap-2">
                            {attempt.is_correct ? (
                              <Badge className="bg-green-100 text-green-800">Corretto</Badge>
                            ) : (
                              <Badge variant="secondary">Non corretto</Badge>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(attempt.created_at!).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-white rounded border">
                            <p className="text-sm text-gray-500 mb-1">Risposta studente:</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{attempt.student_answer}</p>
                          </div>
                          <div className={`p-3 rounded border ${
                            attempt.is_correct
                              ? 'bg-green-50 border-green-200'
                              : 'bg-purple-50 border-purple-200'
                          }`}>
                            <p className={`text-sm mb-1 ${
                              attempt.is_correct ? 'text-green-600' : 'text-purple-600'
                            }`}>
                              Feedback AI:
                            </p>
                            <p className={`whitespace-pre-wrap ${
                              attempt.is_correct ? 'text-green-700' : 'text-purple-700'
                            }`}>
                              {attempt.ai_feedback}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Nessuno studente ha ancora provato questo caso di studio</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
