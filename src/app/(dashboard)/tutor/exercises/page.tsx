import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExercisesTabs } from '@/components/tutor/exercises-tabs'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function TutorExercisesPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'tutor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  // Get all courses for the dropdown (shared by both tabs)
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name')
    .order('name')

  // Get all quizzes with submission counts
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select(`
      *,
      courses (name),
      quiz_submissions (id, tutor_feedback, score)
    `)
    .order('created_at', { ascending: false })

  // For MC quizzes, get question counts
  const mcQuizIds = quizzes?.filter(q => q.quiz_type === 'multiple_choice').map(q => q.id) || []
  let questionCounts: Record<string, number> = {}
  if (mcQuizIds.length > 0) {
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('quiz_id')
      .in('quiz_id', mcQuizIds)
    questions?.forEach(q => {
      questionCounts[q.quiz_id] = (questionCounts[q.quiz_id] || 0) + 1
    })
  }

  // Get all case studies with attempt counts
  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select(`
      *,
      courses (name),
      case_study_attempts (id, is_correct, profile_id)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Esercizi</h1>
        <p className="text-gray-600">Gestisci quiz e casi di studio</p>
      </div>

      <ExercisesTabs
        quizzes={quizzes || []}
        questionCounts={questionCounts}
        courses={courses || []}
        caseStudies={caseStudies || []}
        defaultTab={tab}
      />
    </div>
  )
}
