'use client'

import { useState } from 'react'
import { submitMCQuiz } from '@/app/actions/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const LETTER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

interface QuizMCFormProps {
  quizId: string
  questions: Array<{
    id: string
    question_text: string
    options: string[]
    sort_order: number | null
  }>
  onComplete: (result: {
    score: number
    correctCount: number
    totalQuestions: number
    answers: Array<{
      question_id: string
      selected_index: number
      is_correct: boolean
    }>
  }) => void
}

export function QuizMCForm({ quizId, questions, onComplete }: QuizMCFormProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({})
  const [loading, setLoading] = useState(false)

  const sortedQuestions = [...questions].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  const answeredCount = Object.keys(selectedAnswers).length
  const allAnswered = answeredCount === sortedQuestions.length

  function handleSelect(questionId: string, optionIndex: number) {
    if (loading) return
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allAnswered || loading) return

    setLoading(true)

    const answers = Object.entries(selectedAnswers).map(
      ([question_id, selected_index]) => ({
        question_id,
        selected_index,
      })
    )

    const result = await submitMCQuiz(quizId, answers)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    if (result.data) {
      onComplete(result.data)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {answeredCount} di {sortedQuestions.length} risposte
      </div>

      {sortedQuestions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {index + 1}. {question.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const isSelected =
                selectedAnswers[question.id] === optionIndex
              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => handleSelect(question.id, optionIndex)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors min-h-[44px]',
                    isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                      isSelected
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {LETTER_LABELS[optionIndex] ?? optionIndex + 1}
                  </span>
                  <span>{option}</span>
                </button>
              )
            })}
          </CardContent>
        </Card>
      ))}

      <Button
        type="submit"
        disabled={!allAnswered || loading}
        className="w-full"
      >
        {loading ? 'Invio in corso...' : 'Completa quiz'}
      </Button>
    </form>
  )
}
