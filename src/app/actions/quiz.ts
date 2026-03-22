'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitMCQuiz(
  quizId: string,
  answers: { question_id: string; selected_index: number }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorizzato' }

  // Check if already submitted
  const { data: existing } = await supabase
    .from('quiz_submissions')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('profile_id', user.id)
    .single()

  if (existing) return { error: 'Hai già completato questo quiz' }

  // Fetch questions with correct answers (server-side only!)
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_option_index')
    .eq('quiz_id', quizId)

  if (!questions || questions.length === 0) return { error: 'Quiz non trovato' }

  // Calculate score
  let correctCount = 0
  const answersWithCorrectness = answers.map(a => {
    const question = questions.find(q => q.id === a.question_id)
    const isCorrect = question
      ? question.correct_option_index === a.selected_index
      : false
    if (isCorrect) correctCount++
    return { ...a, is_correct: isCorrect }
  })

  const totalQuestions = questions.length
  const score = totalQuestions > 0 ? correctCount / totalQuestions : 0

  // Insert submission
  const { error } = await supabase.from('quiz_submissions').insert({
    quiz_id: quizId,
    profile_id: user.id,
    answers: answersWithCorrectness,
    score,
    total_questions: totalQuestions,
    correct_count: correctCount,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/student/exercises')
  return {
    data: {
      score,
      correctCount,
      totalQuestions,
      answers: answersWithCorrectness,
    },
  }
}
