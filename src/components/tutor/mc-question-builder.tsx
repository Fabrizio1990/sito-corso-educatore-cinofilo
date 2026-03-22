'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus } from 'lucide-react'

export interface MCQuestionData {
  question_text: string
  options: string[]
  correct_option_index: number
}

interface MCQuestionBuilderProps {
  questions: MCQuestionData[]
  onChange: (questions: MCQuestionData[]) => void
}

function createEmptyQuestion(): MCQuestionData {
  return {
    question_text: '',
    options: ['', '', '', ''],
    correct_option_index: -1,
  }
}

export function MCQuestionBuilder({ questions, onChange }: MCQuestionBuilderProps) {
  const updateQuestion = (index: number, updated: Partial<MCQuestionData>) => {
    const next = questions.map((q, i) => (i === index ? { ...q, ...updated } : q))
    onChange(next)
  }

  const addQuestion = () => {
    onChange([...questions, createEmptyQuestion()])
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return
    onChange(questions.filter((_, i) => i !== index))
  }

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const q = questions[qIndex]
    const newOptions = q.options.map((o, i) => (i === oIndex ? text : o))
    updateQuestion(qIndex, { options: newOptions })
  }

  const addOption = (qIndex: number) => {
    const q = questions[qIndex]
    if (q.options.length >= 6) return
    updateQuestion(qIndex, { options: [...q.options, ''] })
  }

  const removeOption = (qIndex: number) => {
    const q = questions[qIndex]
    if (q.options.length <= 2) return
    const newOptions = q.options.slice(0, -1)
    const newCorrect =
      q.correct_option_index >= newOptions.length ? -1 : q.correct_option_index
    updateQuestion(qIndex, { options: newOptions, correct_option_index: newCorrect })
  }

  return (
    <div className="grid gap-4">
      {questions.map((q, qIndex) => (
        <Card key={qIndex} className="py-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Domanda {qIndex + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                onClick={() => removeQuestion(qIndex)}
                disabled={questions.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input
              value={q.question_text}
              onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
              placeholder="Scrivi la domanda..."
            />

            <div className="grid gap-2">
              {q.options.map((option, oIndex) => {
                const isCorrect = q.correct_option_index === oIndex
                return (
                  <label
                    key={oIndex}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                      isCorrect
                        ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950'
                        : 'border-input'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={isCorrect}
                      onChange={() =>
                        updateQuestion(qIndex, { correct_option_index: oIndex })
                      }
                      className="h-4 w-4 accent-green-600"
                    />
                    <Input
                      value={option}
                      onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                      placeholder={`Opzione ${String.fromCharCode(65 + oIndex)}`}
                      className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    />
                  </label>
                )
              })}
            </div>

            <div className="flex gap-2">
              {q.options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(qIndex)}
                  className="text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Aggiungi opzione
                </Button>
              )}
              {q.options.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeOption(qIndex)}
                  className="text-xs"
                >
                  Rimuovi opzione
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Aggiungi domanda
      </Button>
    </div>
  )
}

export { createEmptyQuestion }
