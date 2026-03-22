'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MCQuestionBuilder, createEmptyQuestion } from './mc-question-builder'
import type { MCQuestionData } from './mc-question-builder'

type QuizType = 'text' | 'multiple_choice'

interface CreateQuizDialogProps {
  courses: { id: string; name: string }[]
}

export function CreateQuizDialog({ courses }: CreateQuizDialogProps) {
  const [open, setOpen] = useState(false)
  const [quizType, setQuizType] = useState<QuizType>('text')
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [mcQuestions, setMcQuestions] = useState<MCQuestionData[]>([createEmptyQuestion()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const resetForm = () => {
    setCourseId('')
    setTitle('')
    setQuestion('')
    setQuizType('text')
    setMcQuestions([createEmptyQuestion()])
    setError(null)
  }

  const validateMC = (): string | null => {
    if (mcQuestions.length === 0) {
      return 'Aggiungi almeno una domanda.'
    }
    for (let i = 0; i < mcQuestions.length; i++) {
      const q = mcQuestions[i]
      if (!q.question_text.trim()) {
        return `La domanda ${i + 1} non ha un testo.`
      }
      if (q.options.length < 2) {
        return `La domanda ${i + 1} deve avere almeno 2 opzioni.`
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          return `La domanda ${i + 1}, opzione ${String.fromCharCode(65 + j)} e' vuota.`
        }
      }
      if (q.correct_option_index < 0 || q.correct_option_index >= q.options.length) {
        return `Seleziona la risposta corretta per la domanda ${i + 1}.`
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (quizType === 'multiple_choice') {
      const validationError = validateMC()
      if (validationError) {
        setError(validationError)
        setLoading(false)
        return
      }
    }

    if (quizType === 'text') {
      const { error } = await supabase.from('quizzes').insert({
        course_id: courseId,
        title,
        question,
        quiz_type: 'text',
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          course_id: courseId,
          title,
          question: null,
          quiz_type: 'multiple_choice',
        })
        .select('id')
        .single()

      if (quizError || !quiz) {
        setError(quizError?.message ?? 'Errore nella creazione del quiz.')
        setLoading(false)
        return
      }

      const rows = mcQuestions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        sort_order: index,
      }))

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(rows)

      if (questionsError) {
        setError(questionsError.message)
        setLoading(false)
        return
      }
    }

    setOpen(false)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  const isTextDisabled = loading || !courseId || !title || !question
  const isMCDisabled = loading || !courseId || !title
  const isSubmitDisabled = quizType === 'text' ? isTextDisabled : isMCDisabled

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button>Nuovo Quiz</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crea nuovo quiz</DialogTitle>
            <DialogDescription>
              Crea una domanda aperta o un quiz a risposta multipla per gli studenti
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant={quizType === 'text' ? 'default' : 'outline'}
                onClick={() => setQuizType('text')}
                className="flex-1"
              >
                Domanda aperta
              </Button>
              <Button
                type="button"
                variant={quizType === 'multiple_choice' ? 'default' : 'outline'}
                onClick={() => setQuizType('multiple_choice')}
                className="flex-1"
              >
                Risposta multipla
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="course">Corso *</Label>
              <Select value={courseId} onValueChange={setCourseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un corso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Quiz Modulo 3 - Comunicazione canina"
                required
              />
            </div>

            {quizType === 'text' ? (
              <div className="grid gap-2">
                <Label htmlFor="question">Domanda *</Label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Scrivi la domanda o descrivi il caso studio..."
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
                <p className="text-xs text-gray-500">
                  Puoi inserire domande aperte, casi studio, o situazioni da analizzare
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Domande *</Label>
                <MCQuestionBuilder questions={mcQuestions} onChange={setMcQuestions} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {loading ? 'Creazione...' : 'Crea quiz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
