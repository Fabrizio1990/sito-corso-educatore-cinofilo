'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QuizFeedbackForm } from './quiz-feedback-form'

interface QuizSubmission {
  id: string
  answer: string
  submitted_at: string | null
  tutor_feedback: string | null
  profiles: {
    id: string
    full_name: string
    email: string
  }
}

interface Quiz {
  id: string
  title: string
  question: string
  submissions: QuizSubmission[]
}

interface ClassQuizSubmissionsProps {
  quizzes: Quiz[]
}

export function ClassQuizSubmissions({ quizzes }: ClassQuizSubmissionsProps) {
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-gray-500">Nessun quiz disponibile per questo corso</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => {
        const pendingCount = quiz.submissions.filter(s => !s.tutor_feedback).length
        const reviewedCount = quiz.submissions.filter(s => s.tutor_feedback).length
        const isExpanded = expandedQuiz === quiz.id

        return (
          <Card key={quiz.id}>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedQuiz(isExpanded ? null : quiz.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {quiz.title}
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">{quiz.question}</CardDescription>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {pendingCount > 0 && (
                    <Badge variant="destructive">{pendingCount} da valutare</Badge>
                  )}
                  {reviewedCount > 0 && (
                    <Badge variant="secondary">{reviewedCount} valutate</Badge>
                  )}
                  {quiz.submissions.length === 0 && (
                    <Badge variant="outline">Nessuna risposta</Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="border-t pt-4">
                {quiz.submissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nessuno studente di questa classe ha risposto a questo quiz
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Pending submissions first */}
                    {quiz.submissions
                      .filter(s => !s.tutor_feedback)
                      .map((submission) => (
                        <SubmissionCard
                          key={submission.id}
                          submission={submission}
                          quizTitle={quiz.title}
                          isPending
                        />
                      ))}

                    {/* Reviewed submissions */}
                    {quiz.submissions
                      .filter(s => s.tutor_feedback)
                      .map((submission) => (
                        <SubmissionCard
                          key={submission.id}
                          submission={submission}
                          quizTitle={quiz.title}
                          isPending={false}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

interface SubmissionCardProps {
  submission: QuizSubmission
  quizTitle: string
  isPending: boolean
}

function SubmissionCard({ submission, quizTitle, isPending }: SubmissionCardProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  return (
    <div
      className={`p-4 rounded-lg border ${
        isPending ? 'border-orange-200 bg-orange-50/50' : 'bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-medium">{submission.profiles.full_name}</p>
          <p className="text-sm text-gray-500">{submission.profiles.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {isPending ? (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Da valutare
            </Badge>
          ) : (
            <Badge variant="secondary">Valutata</Badge>
          )}
          <span className="text-xs text-gray-400">
            {submission.submitted_at &&
              new Date(submission.submitted_at).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
          </span>
        </div>
      </div>

      <div className="p-3 bg-white rounded border mb-3">
        <p className="text-sm text-gray-500 mb-1">Risposta:</p>
        <p className="text-gray-700 whitespace-pre-wrap">{submission.answer}</p>
      </div>

      {submission.tutor_feedback ? (
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-green-600 mb-1">Feedback:</p>
          <p className="text-green-700 whitespace-pre-wrap">{submission.tutor_feedback}</p>
        </div>
      ) : showFeedbackForm ? (
        <QuizFeedbackForm
          submissionId={submission.id}
          studentEmail={submission.profiles.email}
          quizTitle={quizTitle}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFeedbackForm(true)}
          className="w-full"
        >
          Aggiungi Feedback
        </Button>
      )}
    </div>
  )
}
