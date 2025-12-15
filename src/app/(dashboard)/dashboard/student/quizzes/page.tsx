import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuizAnswerForm } from '@/components/student/quiz-answer-form'

export default async function StudentQuizzesPage() {
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
          <h1 className="text-3xl font-bold">Quiz e Verifiche</h1>
          <p className="text-gray-600">Completa quiz e casi studio</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Non sei iscritto a nessun corso</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get all quizzes for enrolled courses
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select(`
      *,
      courses (name)
    `)
    .in('course_id', courseIds)
    .order('created_at', { ascending: false })

  // Get user's submissions
  const { data: submissions } = await supabase
    .from('quiz_submissions')
    .select('*')
    .eq('profile_id', user.id)

  const submissionsByQuiz = submissions?.reduce((acc, sub) => {
    acc[sub.quiz_id] = sub
    return acc
  }, {} as Record<string, typeof submissions[0]>)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quiz e Verifiche</h1>
        <p className="text-gray-600">Completa quiz e casi studio per ricevere feedback dal tutor</p>
      </div>

      {quizzes && quizzes.length > 0 ? (
        <div className="space-y-6">
          {quizzes.map((quiz) => {
            const submission = submissionsByQuiz?.[quiz.id]
            const hasSubmitted = !!submission
            const hasFeedback = !!submission?.tutor_feedback

            return (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{quiz.title}</CardTitle>
                      <CardDescription>
                        {(quiz.courses as { name: string })?.name}
                      </CardDescription>
                    </div>
                    {hasSubmitted ? (
                      <Badge variant={hasFeedback ? 'default' : 'secondary'}>
                        {hasFeedback ? 'Feedback ricevuto' : 'In attesa di feedback'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Da completare</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-2">Domanda:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{quiz.question}</p>
                    </div>

                    {hasSubmitted ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="font-medium mb-2 text-blue-800">La tua risposta:</p>
                          <p className="text-blue-700 whitespace-pre-wrap">{submission.answer}</p>
                          <p className="text-xs text-blue-500 mt-2">
                            Inviata il {new Date(submission.submitted_at!).toLocaleDateString('it-IT')}
                          </p>
                        </div>

                        {hasFeedback && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="font-medium mb-2 text-green-800">Feedback del tutor:</p>
                            <p className="text-green-700 whitespace-pre-wrap">{submission.tutor_feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <QuizAnswerForm quizId={quiz.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Nessun quiz disponibile</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
