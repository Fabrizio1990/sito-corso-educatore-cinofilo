import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { QuizFeedbackForm } from '@/components/tutor/quiz-feedback-form'
import { MCSubmissionDetail } from '@/components/tutor/mc-submission-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

function getScoreBadgeClasses(percentage: number) {
  if (percentage >= 70) return 'bg-green-100 text-green-800 border-green-300'
  if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  return 'bg-red-100 text-red-800 border-red-300'
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

  // Fetch quiz questions for MC quizzes
  let questions: any[] = []
  if (quiz.quiz_type === 'multiple_choice') {
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id)
      .order('sort_order')
    questions = data || []
  }

  const isMC = quiz.quiz_type === 'multiple_choice'

  // --- TEXT QUIZ RENDERING ---
  if (!isMC) {
    const pendingSubmissions = submissions?.filter(s => !s.tutor_feedback) || []
    const reviewedSubmissions = submissions?.filter(s => s.tutor_feedback) || []

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link href="/tutor/exercises" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            ← Torna agli esercizi
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">{quiz.title}</h1>
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

  // --- MULTIPLE CHOICE QUIZ RENDERING ---
  const allSubmissions = submissions || []
  const totalSubmissions = allSubmissions.length

  // Calculate stats
  const avgScore =
    totalSubmissions > 0
      ? allSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0) / totalSubmissions
      : 0
  const avgPercentage = Math.round(avgScore * 100)

  const perfect = allSubmissions.filter(s => Math.round((s.score ?? 0) * 100) === 100).length
  const high = allSubmissions.filter(s => {
    const p = Math.round((s.score ?? 0) * 100)
    return p >= 75 && p < 100
  }).length
  const medium = allSubmissions.filter(s => {
    const p = Math.round((s.score ?? 0) * 100)
    return p >= 50 && p < 75
  }).length
  const low = allSubmissions.filter(s => Math.round((s.score ?? 0) * 100) < 50).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/tutor/exercises" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Torna agli esercizi
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">{quiz.title}</h1>
          <Badge variant="secondary">Risposta multipla</Badge>
        </div>
        <p className="text-gray-600">{(quiz.courses as { name: string })?.name}</p>
      </div>

      {/* Questions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domande del quiz</CardTitle>
          <CardDescription>{questions.length} domande</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">
                {index + 1}. {q.question_text}
              </p>
              <div className="space-y-1">
                {(q.options as string[]).map((option: string, oIndex: number) => {
                  const isCorrect = q.correct_option_index === oIndex
                  return (
                    <div
                      key={oIndex}
                      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                        isCorrect
                          ? 'bg-green-50 text-green-800 font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      {isCorrect && <Check className="h-4 w-4 shrink-0" />}
                      <span>
                        {String.fromCharCode(65 + oIndex)}. {option}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalSubmissions}</p>
              <p className="text-gray-500">Risposte totali</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className={`text-3xl font-bold ${avgPercentage >= 70 ? 'text-green-600' : avgPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {totalSubmissions > 0 ? `${avgPercentage}%` : '-'}
              </p>
              <p className="text-gray-500">Punteggio medio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="flex justify-between text-sm px-2">
                <span className="text-green-600">100%</span>
                <span className="font-medium">{perfect}</span>
              </div>
              <div className="flex justify-between text-sm px-2">
                <span className="text-green-500">75-99%</span>
                <span className="font-medium">{high}</span>
              </div>
              <div className="flex justify-between text-sm px-2">
                <span className="text-yellow-600">50-74%</span>
                <span className="font-medium">{medium}</span>
              </div>
              <div className="flex justify-between text-sm px-2">
                <span className="text-red-600">&lt;50%</span>
                <span className="font-medium">{low}</span>
              </div>
              <p className="text-gray-500 text-xs pt-1">Distribuzione punteggi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      {allSubmissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Risposte degli studenti</h2>
          <div className="space-y-4">
            {allSubmissions.map((submission) => {
              const student = submission.profiles as { full_name: string; email: string }
              const correctCount = submission.correct_count ?? 0
              const totalQuestions = submission.total_questions ?? questions.length
              const percentage = Math.round((submission.score ?? 0) * 100)

              return (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{student?.full_name}</CardTitle>
                        <CardDescription>{student?.email}</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold ${getScoreBadgeClasses(percentage)}`}
                        >
                          {correctCount}/{totalQuestions} ({percentage}%)
                        </span>
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MCSubmissionDetail
                      answers={submission.answers as any[]}
                      questions={questions}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* No submissions */}
      {totalSubmissions === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Nessuno studente ha ancora risposto a questo quiz</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
