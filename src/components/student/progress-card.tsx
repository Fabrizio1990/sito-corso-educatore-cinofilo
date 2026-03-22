import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ProgressCardProps {
  courseName: string
  editionName: string
  attendance: { present: number; total: number; percentage: number }
  quizzes: { completed: number; total: number }
  caseStudies: { completed: number; total: number }
  mcAverageScore?: number
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

function MetricRow({
  label,
  value,
  barValue,
  color,
}: {
  label: string
  value: string
  barValue: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <ProgressBar value={barValue} color={color} />
    </div>
  )
}

export function ProgressCard({
  courseName,
  editionName,
  attendance,
  quizzes,
  caseStudies,
  mcAverageScore,
}: ProgressCardProps) {
  const quizPercentage = quizzes.total > 0 ? (quizzes.completed / quizzes.total) * 100 : 0
  const caseStudyPercentage = caseStudies.total > 0 ? (caseStudies.completed / caseStudies.total) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{courseName}</CardTitle>
        <CardDescription>{editionName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {attendance.total > 0 ? (
          <MetricRow
            label="Presenze"
            value={`${attendance.percentage}%  (${attendance.present}/${attendance.total})`}
            barValue={attendance.percentage}
            color="bg-green-500"
          />
        ) : (
          <div className="space-y-1">
            <span className="text-sm text-gray-500">Presenze</span>
            <p className="text-sm text-gray-400">Nessuna lezione svolta</p>
          </div>
        )}

        {quizzes.total > 0 ? (
          <div className="space-y-1">
            <MetricRow
              label="Quiz completati"
              value={`${quizzes.completed}/${quizzes.total}`}
              barValue={quizPercentage}
              color="bg-blue-500"
            />
            {mcAverageScore !== undefined && (
              <p className="text-sm text-gray-500 pl-0.5">
                Media risposta multipla: <span className="font-medium text-blue-600">{mcAverageScore}%</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-sm text-gray-500">Quiz completati</span>
            <p className="text-sm text-gray-400">Nessun quiz disponibile</p>
          </div>
        )}

        {caseStudies.total > 0 ? (
          <MetricRow
            label="Casi studio completati"
            value={`${caseStudies.completed}/${caseStudies.total}`}
            barValue={caseStudyPercentage}
            color="bg-purple-500"
          />
        ) : (
          <div className="space-y-1">
            <span className="text-sm text-gray-500">Casi studio completati</span>
            <p className="text-sm text-gray-400">Nessun caso studio disponibile</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
