'use client'

import { Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const LETTER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

interface QuizMCResultsProps {
  score: number
  correctCount: number
  totalQuestions: number
  answers: Array<{
    question_id: string
    selected_index: number
    is_correct: boolean
  }>
  questions: Array<{
    id: string
    question_text: string
    options: string[]
    correct_option_index: number
  }>
}

function getScoreColor(score: number) {
  if (score >= 0.7) return 'green'
  if (score >= 0.5) return 'yellow'
  return 'red'
}

const scoreBannerStyles = {
  green: 'from-green-500 to-green-600 text-white',
  yellow: 'from-yellow-400 to-yellow-500 text-yellow-950',
  red: 'from-red-500 to-red-600 text-white',
} as const

export function QuizMCResults({
  score,
  correctCount,
  totalQuestions,
  answers,
  questions,
}: QuizMCResultsProps) {
  const color = getScoreColor(score)
  const percentage = Math.round(score * 100)

  return (
    <div className="space-y-6">
      {/* Score banner */}
      <Card className="overflow-hidden border-0">
        <div
          className={cn(
            'bg-gradient-to-r p-6 text-center',
            scoreBannerStyles[color]
          )}
        >
          <p className="text-lg font-medium">Hai ottenuto</p>
          <p className="text-4xl font-bold">
            {correctCount}/{totalQuestions}
          </p>
          <p className="text-lg font-medium">({percentage}%)</p>
        </div>
      </Card>

      {/* Per-question breakdown */}
      <div className="space-y-3">
        {questions.map((question, index) => {
          const answer = answers.find(a => a.question_id === question.id)
          if (!answer) return null

          const selectedOption = question.options[answer.selected_index]
          const correctOption = question.options[question.correct_option_index]
          const selectedLetter =
            LETTER_LABELS[answer.selected_index] ?? String(answer.selected_index + 1)
          const correctLetter =
            LETTER_LABELS[question.correct_option_index] ??
            String(question.correct_option_index + 1)

          return (
            <Card key={question.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {index + 1}. {question.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Student's answer */}
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                    answer.is_correct
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  )}
                >
                  {answer.is_correct ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    {selectedLetter}. {selectedOption}
                  </span>
                </div>

                {/* Correct answer (only if wrong) */}
                {!answer.is_correct && (
                  <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>
                      Risposta corretta: {correctLetter}. {correctOption}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
