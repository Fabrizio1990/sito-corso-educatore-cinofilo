'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface QuizAnswerFormProps {
  quizId: string
}

export function QuizAnswerForm({ quizId }: QuizAnswerFormProps) {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Devi essere autenticato')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('quiz_submissions').insert({
      quiz_id: quizId,
      profile_id: user.id,
      answer,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="answer">La tua risposta</Label>
        <textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Scrivi la tua risposta..."
          required
          className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <Button type="submit" disabled={loading || !answer.trim()}>
        {loading ? 'Invio in corso...' : 'Invia risposta'}
      </Button>
    </form>
  )
}
