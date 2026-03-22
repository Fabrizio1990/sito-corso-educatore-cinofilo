'use client'

import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LETTER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

interface MCSubmissionDetailProps {
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
    sort_order: number | null
  }>
}

export function MCSubmissionDetail({ answers, questions }: MCSubmissionDetailProps) {
  const [open, setOpen] = useState(false)

  const sortedQuestions = [...questions].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="text-sm text-muted-foreground"
      >
        {open ? (
          <>
            <ChevronUp className="mr-1 h-4 w-4" />
            Nascondi dettaglio
          </>
        ) : (
          <>
            <ChevronDown className="mr-1 h-4 w-4" />
            Vedi dettaglio
          </>
        )}
      </Button>

      {open && (
        <div className="mt-3 space-y-3">
          {sortedQuestions.map((question, index) => {
            const answer = answers.find(a => a.question_id === question.id)
            if (!answer) return null

            const selectedLetter =
              LETTER_LABELS[answer.selected_index] ?? String(answer.selected_index + 1)
            const selectedOption = question.options[answer.selected_index]
            const correctLetter =
              LETTER_LABELS[question.correct_option_index] ??
              String(question.correct_option_index + 1)
            const correctOption = question.options[question.correct_option_index]

            return (
              <div key={question.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium mb-2">
                  {index + 1}. {question.question_text}
                </p>
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
                {!answer.is_correct && (
                  <div className="mt-1 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>
                      Risposta corretta: {correctLetter}. {correctOption}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
