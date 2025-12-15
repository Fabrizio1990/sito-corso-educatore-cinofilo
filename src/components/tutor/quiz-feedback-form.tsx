'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { notifyQuizFeedback } from '@/lib/notifications'

interface QuizFeedbackFormProps {
  submissionId: string
  studentEmail?: string
  quizTitle?: string
}

export function QuizFeedbackForm({ submissionId, studentEmail, quizTitle }: QuizFeedbackFormProps) {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('quiz_submissions')
      .update({ tutor_feedback: feedback })
      .eq('id', submissionId)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Send notification to student (fire and forget)
    if (studentEmail && quizTitle) {
      notifyQuizFeedback(studentEmail, quizTitle)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      <div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Scrivi il tuo feedback per lo studente..."
          className="flex min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !feedback.trim()}>
          {loading ? 'Invio...' : 'Invia feedback'}
        </Button>
      </div>
    </form>
  )
}
