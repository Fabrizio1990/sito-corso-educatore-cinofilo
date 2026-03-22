'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CreateQuizDialog } from '@/components/tutor/create-quiz-dialog'
import { DeleteQuizButton } from '@/components/tutor/delete-quiz-button'
import { CreateCaseStudyDialog } from '@/components/tutor/create-case-study-dialog'
import { DeleteCaseStudyButton } from '@/components/tutor/delete-case-study-button'

interface ExercisesTabsProps {
  quizzes: any[]
  questionCounts: Record<string, number>
  courses: { id: string; name: string }[]
  caseStudies: any[]
  defaultTab?: string
}

export function ExercisesTabs({
  quizzes,
  questionCounts,
  courses,
  caseStudies,
  defaultTab,
}: ExercisesTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentTab = searchParams.get('tab') || defaultTab || 'quiz'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'quiz') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    const query = params.toString()
    router.replace(`/tutor/exercises${query ? `?${query}` : ''}`, { scroll: false })
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="quiz">Quiz ({quizzes.length})</TabsTrigger>
        <TabsTrigger value="case-studies">Casi di Studio ({caseStudies.length})</TabsTrigger>
      </TabsList>

      {/* Quiz Tab */}
      <TabsContent value="quiz" className="mt-6">
        <div className="space-y-4">
          <div className="flex justify-end">
            <CreateQuizDialog courses={courses} />
          </div>

          {quizzes.length > 0 ? (
            <div className="space-y-4">
              {quizzes.map((quiz) => {
                const submissions = quiz.quiz_submissions as { id: string; tutor_feedback: string | null; score: number | null }[] || []
                const totalSubmissions = submissions.length
                const pendingFeedback = submissions.filter((s: any) => !s.tutor_feedback).length
                const isMC = quiz.quiz_type === 'multiple_choice'

                const mcScores = isMC ? submissions.filter((s: any) => s.score !== null).map((s: any) => s.score as number) : []
                const averageScore = mcScores.length > 0
                  ? Math.round(mcScores.reduce((sum: number, s: number) => sum + s, 0) / mcScores.length)
                  : null

                return (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{quiz.title}</CardTitle>
                            {isMC ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">Risposta multipla</Badge>
                            ) : (
                              <Badge variant="outline">Domanda aperta</Badge>
                            )}
                            {isMC ? (
                              averageScore !== null && (
                                <Badge variant="secondary">Media: {averageScore}%</Badge>
                              )
                            ) : (
                              pendingFeedback > 0 && (
                                <Badge variant="destructive">{pendingFeedback} da valutare</Badge>
                              )
                            )}
                          </div>
                          <CardDescription>
                            {(quiz.courses as { name: string })?.name}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/tutor/quizzes/${quiz.id}`}>
                            <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">
                              Vedi risposte ({totalSubmissions})
                            </button>
                          </Link>
                          <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isMC ? (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            {questionCounts[quiz.id] || 0} domande a risposta multipla
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Domanda:</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{quiz.question}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-3">
                        Creato il {new Date(quiz.created_at!).toLocaleDateString('it-IT')}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-gray-500 mb-4">Nessun quiz creato</p>
                <CreateQuizDialog courses={courses} />
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      {/* Case Studies Tab */}
      <TabsContent value="case-studies" className="mt-6">
        <div className="space-y-4">
          <div className="flex justify-end">
            <CreateCaseStudyDialog courses={courses} />
          </div>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-medium text-blue-900">Come funziona</p>
                  <p className="text-sm text-blue-700">
                    Crea uno scenario (es: &quot;Il cane tira al guinzaglio&quot;) e fornisci la risposta corretta.
                    Gli studenti vedranno solo lo scenario e proveranno a rispondere.
                    L&apos;AI valutera le risposte e fornira suggerimenti finche non arrivano alla soluzione corretta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {caseStudies.length > 0 ? (
            <div className="space-y-4">
              {caseStudies.map((caseStudy) => {
                const attempts = caseStudy.case_study_attempts as { id: string; is_correct: boolean; profile_id: string }[] || []
                const totalAttempts = attempts.length
                const correctAttempts = attempts.filter((a: any) => a.is_correct).length
                const uniqueStudents = new Set(attempts.map((a: any) => a.profile_id)).size

                return (
                  <Card key={caseStudy.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{caseStudy.title}</CardTitle>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              AI
                            </Badge>
                          </div>
                          <CardDescription>
                            {(caseStudy.courses as { name: string })?.name}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/tutor/case-studies/${caseStudy.id}`}>
                            <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">
                              Vedi tentativi ({totalAttempts})
                            </button>
                          </Link>
                          <DeleteCaseStudyButton caseStudyId={caseStudy.id} caseStudyTitle={caseStudy.title} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gray-50 rounded-lg mb-3">
                        <p className="text-sm text-gray-500 mb-1">Scenario:</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.scenario}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          {uniqueStudents} studenti hanno provato
                        </span>
                        {correctAttempts > 0 && (
                          <span className="text-green-600">
                            {correctAttempts} risposte corrette
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Creato il {new Date(caseStudy.created_at!).toLocaleDateString('it-IT')}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-gray-500 mb-4">Nessun caso di studio creato</p>
                <CreateCaseStudyDialog courses={courses} />
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
