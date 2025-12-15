import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CreateQuizDialog } from '@/components/tutor/create-quiz-dialog'
import { DeleteQuizButton } from '@/components/tutor/delete-quiz-button'

export default async function TutorQuizzesPage() {
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

  // Get all courses for the dropdown
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
      quiz_submissions (id, tutor_feedback)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Quiz e Verifiche</h1>
          <p className="text-gray-600">Gestisci quiz e visualizza le risposte degli studenti</p>
        </div>
        <CreateQuizDialog courses={courses || []} />
      </div>

      {/* Quizzes List */}
      {quizzes && quizzes.length > 0 ? (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const submissions = quiz.quiz_submissions as { id: string; tutor_feedback: string | null }[] || []
            const totalSubmissions = submissions.length
            const pendingFeedback = submissions.filter(s => !s.tutor_feedback).length

            return (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        {pendingFeedback > 0 && (
                          <Badge variant="destructive">{pendingFeedback} da valutare</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {(quiz.courses as { name: string })?.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/tutor/quizzes/${quiz.id}`}>
                        <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">
                          Vedi risposte ({totalSubmissions})
                        </button>
                      </Link>
                      <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Domanda:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{quiz.question}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Creato il {new Date(quiz.created_at!).toLocaleDateString('it-IT')}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Nessun quiz creato</p>
            <CreateQuizDialog courses={courses || []} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
