import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ExercisesTabs } from '@/components/student/exercises-tabs'

export default async function StudentExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get enrolled courses through classes
  const { data: enrollments } = await supabase
    .from('class_students')
    .select(`
      classes (
        courses (id, name)
      )
    `)
    .eq('profile_id', user.id)

  const courseIds = enrollments
    ? [...new Set(
        enrollments.map(e => (e.classes as { courses: { id: string } })?.courses?.id).filter(Boolean)
      )]
    : []

  if (courseIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Esercizi</h1>
          <p className="text-gray-600">Quiz e casi di studio dei tuoi corsi</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Non sei iscritto a nessun corso</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch quizzes and case studies in parallel
  const [
    { data: quizzes },
    { data: submissions },
    { data: caseStudies },
    { data: attempts },
  ] = await Promise.all([
    supabase
      .from('quizzes')
      .select(`*, courses (name)`)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('quiz_submissions')
      .select('*')
      .eq('profile_id', user.id),
    supabase
      .from('case_studies')
      .select(`id, title, scenario, course_id, created_at, courses (name)`)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('case_study_attempts')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // Process quiz submissions
  const submissionsByQuiz = submissions?.reduce((acc, sub) => {
    acc[sub.quiz_id] = sub
    return acc
  }, {} as Record<string, typeof submissions[0]>) || {}

  // Fetch questions for multiple choice quizzes
  const mcQuizIds = quizzes?.filter(q => q.quiz_type === 'multiple_choice').map(q => q.id) || []
  let quizQuestions: Record<string, any[]> = {}
  if (mcQuizIds.length > 0) {
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, options, correct_option_index, sort_order')
      .in('quiz_id', mcQuizIds)
      .order('sort_order')

    questions?.forEach(q => {
      if (!quizQuestions[q.quiz_id]) quizQuestions[q.quiz_id] = []
      quizQuestions[q.quiz_id].push(q)
    })
  }

  // Process case study attempts
  const attemptsByCaseStudy = attempts?.reduce((acc, attempt) => {
    if (!acc[attempt.case_study_id]) {
      acc[attempt.case_study_id] = []
    }
    acc[attempt.case_study_id].push(attempt)
    return acc
  }, {} as Record<string, typeof attempts>) || {}

  const defaultTab = tab === 'case-studies' ? 'case-studies' : 'quiz'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Esercizi</h1>
        <p className="text-gray-600">Quiz e casi di studio dei tuoi corsi</p>
      </div>

      <ExercisesTabs
        quizzes={quizzes || []}
        quizQuestions={quizQuestions}
        submissionsByQuiz={submissionsByQuiz}
        caseStudies={caseStudies || []}
        attemptsByCaseStudy={attemptsByCaseStudy}
        defaultTab={defaultTab}
      />
    </div>
  )
}
