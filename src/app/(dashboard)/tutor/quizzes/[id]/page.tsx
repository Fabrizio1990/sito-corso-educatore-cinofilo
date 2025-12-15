import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { QuizFeedbackForm } from '@/components/tutor/quiz-feedback-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuizSubmissionsPage({ params }: PageProps) {
  const { id } = await params
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

  // Get quiz details
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      courses (name)
    `)
    .eq('id', id)
    .single()

  if (error || !quiz) {
    notFound()
  }

  // Get all submissions for this quiz
  const { data: submissions } = await supabase
    .from('quiz_submissions')
    .select(`
      *,
      profiles (full_name, email)
    `)
    .eq('quiz_id', id)
    .order('submitted_at', { ascending: false })

  const pendingSubmissions = submissions?.filter(s => !s.tutor_feedback) || []
  const reviewedSubmissions = submissions?.filter(s => s.tutor_feedback) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/tutor/quizzes" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Torna ai quiz
        </Link>
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <p className="text-gray-600">{(quiz.courses as { name: string })?.name}</p>
      </div>

      {/* Quiz Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domanda del quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{quiz.question}</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{submissions?.length || 0}</p>
              <p className="text-gray-500">Risposte totali</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{pendingSubmissions.length}</p>
              <p className="text-gray-500">Da valutare</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{reviewedSubmissions.length}</p>
              <p className="text-gray-500">Valutate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Submissions */}
      {pendingSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Da valutare
            <Badge variant="destructive">{pendingSubmissions.length}</Badge>
          </h2>
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => {
              const student = submission.profiles as { full_name: string; email: string }
              return (
                <Card key={submission.id} className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{student?.full_name}</CardTitle>
                        <CardDescription>{student?.email}</CardDescription>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(submission.submitted_at!).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-sm text-gray-500 mb-1">Risposta dello studente:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{submission.answer}</p>
                    </div>
                    <QuizFeedbackForm
                      submissionId={submission.id}
                      studentEmail={student?.email}
                      quizTitle={quiz.title}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Reviewed Submissions */}
      {reviewedSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-600">Risposte valutate</h2>
          <div className="space-y-4">
            {reviewedSubmissions.map((submission) => {
              const student = submission.profiles as { full_name: string; email: string }
              return (
                <Card key={submission.id} className="bg-gray-50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{student?.full_name}</CardTitle>
                        <CardDescription>{student?.email}</CardDescription>
                      </div>
                      <Badge variant="secondary">Valutata</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-sm text-gray-500 mb-1">Risposta:</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{submission.answer}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Il tuo feedback:</p>
                      <p className="text-green-700 whitespace-pre-wrap">{submission.tutor_feedback}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* No submissions */}
      {(!submissions || submissions.length === 0) && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Nessuno studente ha ancora risposto a questo quiz</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
