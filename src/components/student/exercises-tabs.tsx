'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizAnswerForm } from '@/components/student/quiz-answer-form'
import { QuizMCSection } from '@/components/student/quiz-mc-section'
import { CaseStudyAnswerForm } from '@/components/student/case-study-answer-form'

interface ExercisesTabsProps {
  quizzes: any[]
  quizQuestions: Record<string, any[]>
  submissionsByQuiz: Record<string, any>
  caseStudies: any[]
  attemptsByCaseStudy: Record<string, any[]>
  defaultTab?: string
}

export function ExercisesTabs({
  quizzes,
  quizQuestions,
  submissionsByQuiz,
  caseStudies,
  attemptsByCaseStudy,
  defaultTab = 'quiz',
}: ExercisesTabsProps) {
  const quizCount = quizzes.length
  const caseStudyCount = caseStudies.length

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="quiz">
          Quiz {quizCount > 0 && `(${quizCount})`}
        </TabsTrigger>
        <TabsTrigger value="case-studies">
          Casi di Studio {caseStudyCount > 0 && `(${caseStudyCount})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="quiz" className="mt-6">
        {quizzes.length > 0 ? (
          <div className="space-y-6">
            {quizzes.map((quiz) => {
              const submission = submissionsByQuiz?.[quiz.id]
              const hasSubmitted = !!submission
              const hasFeedback = !!submission?.tutor_feedback
              const isMC = quiz.quiz_type === 'multiple_choice'
              const questions = isMC ? (quizQuestions[quiz.id] || []) : []

              return (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{quiz.title}</CardTitle>
                        <CardDescription>
                          {(quiz.courses as { name: string })?.name}
                        </CardDescription>
                      </div>
                      {isMC ? (
                        hasSubmitted ? (
                          <Badge className="bg-green-100 text-green-800">
                            Punteggio: {submission.correct_count}/{submission.total_questions} ({Math.round((submission.score ?? 0) * 100)}%)
                          </Badge>
                        ) : (
                          <Badge variant="outline">{questions.length} domande</Badge>
                        )
                      ) : (
                        hasSubmitted ? (
                          <Badge variant={hasFeedback ? 'default' : 'secondary'}>
                            {hasFeedback ? 'Feedback ricevuto' : 'In attesa di feedback'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Da completare</Badge>
                        )
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isMC ? (
                      <QuizMCSection
                        quizId={quiz.id}
                        questions={questions}
                        existingSubmission={hasSubmitted ? {
                          score: submission.score ?? 0,
                          correct_count: submission.correct_count ?? 0,
                          total_questions: submission.total_questions ?? 0,
                          answers: (submission.answers ?? []) as { question_id: string; selected_index: number; is_correct: boolean }[],
                        } : null}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium mb-2">Domanda:</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{quiz.question}</p>
                        </div>

                        {hasSubmitted ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="font-medium mb-2 text-blue-800">La tua risposta:</p>
                              <p className="text-blue-700 whitespace-pre-wrap">{submission.answer}</p>
                              <p className="text-xs text-blue-500 mt-2">
                                Inviata il {new Date(submission.submitted_at!).toLocaleDateString('it-IT')}
                              </p>
                            </div>

                            {hasFeedback && (
                              <div className="p-4 bg-green-50 rounded-lg">
                                <p className="font-medium mb-2 text-green-800">Feedback del tutor:</p>
                                <p className="text-green-700 whitespace-pre-wrap">{submission.tutor_feedback}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <QuizAnswerForm quizId={quiz.id} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">Nessun quiz disponibile</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="case-studies" className="mt-6">
        {/* Info Card */}
        <Card className="bg-purple-50 border-purple-200 mb-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="font-medium text-purple-900">Come funziona</p>
                <p className="text-sm text-purple-700">
                  Leggi lo scenario e prova a rispondere. L&apos;AI valuter&agrave; la tua risposta e ti dar&agrave;
                  suggerimenti per migliorare finch&eacute; non arrivi alla soluzione corretta.
                  Puoi fare tutti i tentativi che vuoi!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {caseStudies.length > 0 ? (
          <div className="space-y-6">
            {caseStudies.map((caseStudy) => {
              const caseAttempts = attemptsByCaseStudy?.[caseStudy.id] || []
              const hasAttempts = caseAttempts.length > 0
              const isCompleted = caseAttempts.some((a: any) => a.is_correct)
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
                          {caseAttempts.slice(0, 3).map((attempt: any, index: number) => (
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
      </TabsContent>
    </Tabs>
  )
}
