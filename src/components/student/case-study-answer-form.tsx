'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface CaseStudyAnswerFormProps {
  caseStudyId: string
  attemptNumber: number
}

export function CaseStudyAnswerForm({ caseStudyId, attemptNumber }: CaseStudyAnswerFormProps) {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFeedback(null)

    try {
      const response = await fetch('/api/case-study/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseStudyId,
          studentAnswer: answer,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la valutazione')
      }

      setFeedback({
        isCorrect: data.isCorrect,
        text: data.feedback,
      })

      // If correct, refresh page after a short delay
      if (data.isCorrect) {
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        // Clear the answer field for retry
        setAnswer('')
        // Refresh to show the new attempt
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la valutazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Feedback display */}
      {feedback && (
        <div
          className={`p-4 rounded-lg ${
            feedback.isCorrect
              ? 'bg-green-50 border border-green-200'
              : 'bg-purple-50 border border-purple-200'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-xl">
              {feedback.isCorrect ? '✅' : '💡'}
            </span>
            <div>
              <p className={`font-medium mb-1 ${
                feedback.isCorrect ? 'text-green-800' : 'text-purple-800'
              }`}>
                {feedback.isCorrect ? 'Risposta corretta!' : 'Prova ancora'}
              </p>
              <p className={`whitespace-pre-wrap ${
                feedback.isCorrect ? 'text-green-700' : 'text-purple-700'
              }`}>
                {feedback.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form - only show if not just answered correctly */}
      {(!feedback || !feedback.isCorrect) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="answer">
              La tua risposta {attemptNumber > 1 && `(Tentativo #${attemptNumber})`}
            </Label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Analizza lo scenario e scrivi la tua risposta..."
              required
              disabled={loading}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button type="submit" disabled={loading || !answer.trim()}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Valutazione AI in corso...
              </span>
            ) : (
              'Invia risposta'
            )}
          </Button>
          <p className="text-xs text-gray-500">
            L'AI valuterà la tua risposta e ti darà feedback immediato
          </p>
        </form>
      )}
    </div>
  )
}
