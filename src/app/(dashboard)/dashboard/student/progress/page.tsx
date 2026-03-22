import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressCard } from '@/components/student/progress-card'

export default async function StudentProgressPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Get enrolled classes with course info
  const { data: enrollments } = await supabase
    .from('class_students')
    .select('class_id, classes(id, edition_name, courses(id, name))')
    .eq('profile_id', user.id)

  const classIds = enrollments?.map(e => (e.classes as any)?.id).filter(Boolean) || []

  if (classIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">I miei progressi</h1>
          <p className="text-gray-600">Riepilogo del tuo percorso formativo</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Non sei iscritto a nessun corso</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 2. Get all lessons for enrolled classes
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, class_id, lesson_date')
    .in('class_id', classIds)

  // 3. Get student's attendance records
  const { data: attendance } = await supabase
    .from('attendance')
    .select('lesson_id, status')
    .eq('profile_id', user.id)

  // 4. Get course IDs for quiz/case study progress
  const courseIds = [...new Set(
    enrollments?.map(e => (e.classes as any)?.courses?.id).filter(Boolean) || []
  )]

  // 5. Get all quizzes for enrolled courses
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, course_id')
    .in('course_id', courseIds)

  // 6. Get student's quiz submissions
  const { data: submissions } = await supabase
    .from('quiz_submissions')
    .select('quiz_id')
    .eq('profile_id', user.id)

  // 7. Get case studies and attempts
  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select('id, course_id')
    .in('course_id', courseIds)

  const { data: caseAttempts } = await supabase
    .from('case_study_attempts')
    .select('case_study_id, is_correct')
    .eq('profile_id', user.id)

  // --- Compute stats per course ---
  const today = new Date().toISOString().split('T')[0]

  const attendanceByLessonId = new Map(
    attendance?.map(a => [a.lesson_id, a.status]) || []
  )

  const submittedQuizIds = new Set(submissions?.map(s => s.quiz_id) || [])

  const completedCaseStudyIds = new Set(
    caseAttempts
      ?.filter(a => a.is_correct)
      .map(a => a.case_study_id) || []
  )

  // Build per-course data by iterating enrollments
  // A student can be enrolled in multiple classes for the same course,
  // so we group by class (each enrollment is one class).
  interface CourseStats {
    courseName: string
    editionName: string
    attendance: { present: number; total: number; percentage: number }
    quizzes: { completed: number; total: number }
    caseStudies: { completed: number; total: number }
  }

  const courseStatsMap = new Map<string, CourseStats>()

  // We track overall totals
  let overallAttendancePresent = 0
  let overallAttendanceTotal = 0
  let overallQuizzesCompleted = 0
  let overallQuizzesTotal = 0
  let overallCaseStudiesCompleted = 0
  let overallCaseStudiesTotal = 0

  for (const enrollment of enrollments || []) {
    const classData = enrollment.classes as any
    if (!classData) continue

    const courseId = classData.courses?.id as string | undefined
    const courseName = classData.courses?.name as string || 'Corso sconosciuto'
    const editionName = classData.edition_name as string || ''
    const classId = classData.id as string

    // Attendance for this class: past lessons only
    const classLessons = (lessons || []).filter(
      l => l.class_id === classId && l.lesson_date < today
    )
    const presentCount = classLessons.filter(l => {
      const status = attendanceByLessonId.get(l.id)
      return status === 'present' || status === 'late'
    }).length

    const attendancePercentage = classLessons.length > 0
      ? Math.round((presentCount / classLessons.length) * 100)
      : 0

    // Quizzes for this course
    const courseQuizzes = courseId
      ? (quizzes || []).filter(q => q.course_id === courseId)
      : []
    const completedQuizzes = courseQuizzes.filter(q => submittedQuizIds.has(q.id)).length

    // Case studies for this course
    const courseCaseStudies = courseId
      ? (caseStudies || []).filter(cs => cs.course_id === courseId)
      : []
    const completedCases = courseCaseStudies.filter(cs => completedCaseStudyIds.has(cs.id)).length

    // Use a composite key of classId to handle multiple editions
    courseStatsMap.set(classId, {
      courseName,
      editionName,
      attendance: {
        present: presentCount,
        total: classLessons.length,
        percentage: attendancePercentage,
      },
      quizzes: {
        completed: completedQuizzes,
        total: courseQuizzes.length,
      },
      caseStudies: {
        completed: completedCases,
        total: courseCaseStudies.length,
      },
    })

    overallAttendancePresent += presentCount
    overallAttendanceTotal += classLessons.length
    overallQuizzesCompleted += completedQuizzes
    overallQuizzesTotal += courseQuizzes.length
    overallCaseStudiesCompleted += completedCases
    overallCaseStudiesTotal += courseCaseStudies.length
  }

  const overallAttendancePercentage = overallAttendanceTotal > 0
    ? Math.round((overallAttendancePresent / overallAttendanceTotal) * 100)
    : 0

  const courseStatsList = Array.from(courseStatsMap.values())

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">I miei progressi</h1>
        <p className="text-gray-600">Riepilogo del tuo percorso formativo</p>
      </div>

      {/* Overall summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Presenze complessive</p>
            {overallAttendanceTotal > 0 ? (
              <>
                <p className="text-3xl font-bold text-green-600">{overallAttendancePercentage}%</p>
                <p className="text-xs text-gray-400">{overallAttendancePresent}/{overallAttendanceTotal} lezioni</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Nessuna lezione svolta</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Quiz completati</p>
            {overallQuizzesTotal > 0 ? (
              <>
                <p className="text-3xl font-bold text-blue-600">
                  {overallQuizzesCompleted}/{overallQuizzesTotal}
                </p>
                <p className="text-xs text-gray-400">
                  {Math.round((overallQuizzesCompleted / overallQuizzesTotal) * 100)}% completati
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Nessun quiz disponibile</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Casi studio completati</p>
            {overallCaseStudiesTotal > 0 ? (
              <>
                <p className="text-3xl font-bold text-purple-600">
                  {overallCaseStudiesCompleted}/{overallCaseStudiesTotal}
                </p>
                <p className="text-xs text-gray-400">
                  {Math.round((overallCaseStudiesCompleted / overallCaseStudiesTotal) * 100)}% completati
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Nessun caso studio disponibile</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-course detail */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Dettaglio per corso</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courseStatsList.map((stats) => (
            <ProgressCard
              key={`${stats.courseName}-${stats.editionName}`}
              courseName={stats.courseName}
              editionName={stats.editionName}
              attendance={stats.attendance}
              quizzes={stats.quizzes}
              caseStudies={stats.caseStudies}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
