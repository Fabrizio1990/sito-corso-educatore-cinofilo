import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CaseStudyAnswerForm } from '@/components/student/case-study-answer-form'

export default async function StudentCaseStudiesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get enrolled courses through classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select(`
      classes (
        courses (id, name)
      )
    `)
    .eq('profile_id', user.id)

  const courseIds = enrollments
    ? [...new Set(
        enrollments.map(e => (e.classes as { courses: { id: string } })?.courses?.id).filter(Boolean)
      )]
    : []

  if (courseIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Casi di Studio</h1>
          <p className="text-gray-600">Analizza scenari pratici e ricevi feedback dall'AI</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Non sei iscritto a nessun corso</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get all case studies for enrolled courses
  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select(`
      id,
      title,
      scenario,
      course_id,
      created_at,
      courses (name)
    `)
    .in('course_id', courseIds)
    .order('created_at', { ascending: false })

  // Get user's attempts
  const { data: attempts } = await supabase
    .from('case_study_attempts')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  // Group attempts by case study
  const attemptsByCaseStudy = attempts?.reduce((acc, attempt) => {
    if (!acc[attempt.case_study_id]) {
      acc[attempt.case_study_id] = []
    }
    acc[attempt.case_study_id].push(attempt)
    return acc
  }, {} as Record<string, typeof attempts>)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Casi di Studio</h1>
        <p className="text-gray-600">Analizza scenari pratici e ricevi feedback dall'AI in tempo reale</p>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-medium text-purple-900">Come funziona</p>
              <p className="text-sm text-purple-700">
                Leggi lo scenario e prova a rispondere. L'AI valuterà la tua risposta e ti darà
                suggerimenti per migliorare finché non arrivi alla soluzione corretta.
                Puoi fare tutti i tentativi che vuoi!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {caseStudies && caseStudies.length > 0 ? (
        <div className="space-y-6">
          {caseStudies.map((caseStudy) => {
            const caseAttempts = attemptsByCaseStudy?.[caseStudy.id] || []
            const hasAttempts = caseAttempts.length > 0
            const isCompleted = caseAttempts.some(a => a.is_correct)
            const lastAttempt = caseAttempts[0]

            return (
              <Card key={caseStudy.id} className={isCompleted ? 'border-green-200' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{caseStudy.title}</CardTitle>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          AI
                        </Badge>
                      </div>
                      <CardDescription>
                        {(caseStudy.courses as { name: string })?.name}
                      </CardDescription>
                    </div>
                    {isCompleted ? (
                      <Badge className="bg-green-100 text-green-800">Completato</Badge>
                    ) : hasAttempts ? (
                      <Badge variant="secondary">{caseAttempts.length} tentativi</Badge>
                    ) : (
                      <Badge variant="outline">Da provare</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Scenario */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-2">Scenario:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.scenario}</p>
                    </div>

                    {/* Previous attempts */}
                    {hasAttempts && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-600">
                          I tuoi tentativi ({caseAttempts.length}):
                        </p>
                        {caseAttempts.slice(0, 3).map((attempt, index) => (
                          <div
                            key={attempt.id}
                            className={`p-3 rounded-lg border ${
                              attempt.is_correct
                                ? 'border-green-200 bg-green-50/50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium">
                                Tentativo #{attempt.attempt_number}
                              </span>
                              <div className="flex items-center gap-2">
                                {attempt.is_correct ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs">Corretto</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Riprova</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{attempt.student_answer}</p>
                            <div className={`p-2 rounded text-sm ${
                              attempt.is_correct
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              <p className="font-medium mb-1">Feedback AI:</p>
                              <p className="whitespace-pre-wrap">{attempt.ai_feedback}</p>
                            </div>
                          </div>
                        ))}
                        {caseAttempts.length > 3 && (
                          <p className="text-sm text-gray-500 text-center">
                            E altri {caseAttempts.length - 3} tentativi precedenti...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Answer form (only if not completed) */}
                    {!isCompleted && (
                      <CaseStudyAnswerForm
                        caseStudyId={caseStudy.id}
                        attemptNumber={caseAttempts.length + 1}
                      />
                    )}

                    {isCompleted && (
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-green-700 font-medium">
                          Hai completato questo caso di studio!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Nessun caso di studio disponibile</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
