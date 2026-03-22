'use client'

import { useState } from 'react'
import { QuizMCForm } from '@/components/student/quiz-mc-form'
import { QuizMCResults } from '@/components/student/quiz-mc-results'

interface QuizMCSectionProps {
  quizId: string
  questions: Array<{
    id: string
    question_text: string
    options: string[]
    correct_option_index: number
    sort_order: number | null
  }>
  existingSubmission: {
    score: number
    correct_count: number
    total_questions: number
    answers: Array<{
      question_id: string
      selected_index: number
      is_correct: boolean
    }>
  } | null
}

export function QuizMCSection({ quizId, questions, existingSubmission }: QuizMCSectionProps) {
  const [result, setResult] = useState<{
    score: number
    correctCount: number
    totalQuestions: number
    answers: Array<{
      question_id: string
      selected_index: number
      is_correct: boolean
    }>
  } | null>(existingSubmission ? {
    score: existingSubmission.score,
    correctCount: existingSubmission.correct_count,
    totalQuestions: existingSubmission.total_questions,
    answers: existingSubmission.answers,
  } : null)

  if (result) {
    return (
      <QuizMCResults
        score={result.score}
        correctCount={result.correctCount}
        totalQuestions={result.totalQuestions}
        answers={result.answers}
        questions={questions}
      />
    )
  }

  // Strip correct_option_index before passing to form
  const safeQuestions = questions.map(({ correct_option_index, ...q }) => q)

  return <QuizMCForm quizId={quizId} questions={safeQuestions} onComplete={setResult} />
}
