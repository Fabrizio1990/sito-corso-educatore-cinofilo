import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CreateCaseStudyDialog } from '@/components/tutor/create-case-study-dialog'
import { DeleteCaseStudyButton } from '@/components/tutor/delete-case-study-button'

export default async function TutorCaseStudiesPage() {
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Casi di Studio</h1>
          <p className="text-gray-600">Scenari pratici valutati dall'AI per esercitare gli studenti</p>
        </div>
        <CreateCaseStudyDialog courses={courses || []} />
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-medium text-blue-900">Come funziona</p>
              <p className="text-sm text-blue-700">
                Crea uno scenario (es: "Il cane tira al guinzaglio") e fornisci la risposta corretta.
                Gli studenti vedranno solo lo scenario e proveranno a rispondere.
                L'AI valuterà le risposte e fornirà suggerimenti finché non arrivano alla soluzione corretta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Studies List */}
      {caseStudies && caseStudies.length > 0 ? (
        <div className="space-y-4">
          {caseStudies.map((caseStudy) => {
            const attempts = caseStudy.case_study_attempts as { id: string; is_correct: boolean; profile_id: string }[] || []
            const totalAttempts = attempts.length
            const correctAttempts = attempts.filter(a => a.is_correct).length
            const uniqueStudents = new Set(attempts.map(a => a.profile_id)).size

            return (
              <Card key={caseStudy.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{caseStudy.title}</CardTitle>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          AI
                        </Badge>
                      </div>
                      <CardDescription>
                        {(caseStudy.courses as { name: string })?.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/tutor/case-studies/${caseStudy.id}`}>
                        <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">
                          Vedi tentativi ({totalAttempts})
                        </button>
                      </Link>
                      <DeleteCaseStudyButton caseStudyId={caseStudy.id} caseStudyTitle={caseStudy.title} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg mb-3">
                    <p className="text-sm text-gray-500 mb-1">Scenario:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.scenario}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      {uniqueStudents} studenti hanno provato
                    </span>
                    {correctAttempts > 0 && (
                      <span className="text-green-600">
                        {correctAttempts} risposte corrette
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Creato il {new Date(caseStudy.created_at!).toLocaleDateString('it-IT')}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Nessun caso di studio creato</p>
            <CreateCaseStudyDialog courses={courses || []} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
