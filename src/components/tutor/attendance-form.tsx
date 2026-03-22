'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { saveAttendance } from '@/app/actions/attendance'
import { toast } from 'sonner'

interface AttendanceFormProps {
  lessonId: string
  students: Array<{ id: string; full_name: string; email: string }>
  existingAttendance: Array<{ profile_id: string; status: string | null; notes: string | null }>
}

type Status = 'present' | 'absent' | 'excused' | 'late'

interface AttendanceRecord {
  status: Status | null
  notes: string
}

const STATUS_CONFIG: Record<Status, { label: string; active: string; inactive: string }> = {
  present: {
    label: 'Presente',
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-gray-50 text-gray-600 border-gray-200',
  },
  absent: {
    label: 'Assente',
    active: 'bg-red-100 text-red-800 border-red-300',
    inactive: 'bg-gray-50 text-gray-600 border-gray-200',
  },
  excused: {
    label: 'Giustificato',
    active: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    inactive: 'bg-gray-50 text-gray-600 border-gray-200',
  },
  late: {
    label: 'Ritardo',
    active: 'bg-orange-100 text-orange-800 border-orange-300',
    inactive: 'bg-gray-50 text-gray-600 border-gray-200',
  },
}

const STATUSES: Status[] = ['present', 'absent', 'excused', 'late']

export function AttendanceForm({ lessonId, students, existingAttendance }: AttendanceFormProps) {
  const [saving, setSaving] = useState(false)

  // Initialize state from existing attendance
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(() => {
    const initial: Record<string, AttendanceRecord> = {}
    for (const student of students) {
      const existing = existingAttendance.find(a => a.profile_id === student.id)
      initial[student.id] = {
        status: (existing?.status as Status) || null,
        notes: existing?.notes || '',
      }
    }
    return initial
  })

  const setStatus = (studentId: string, status: Status) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId]?.status === status ? null : status,
      },
    }))
  }

  const setNotes = (studentId: string, notes: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }))
  }

  const markAllPresent = () => {
    setRecords(prev => {
      const updated = { ...prev }
      for (const student of students) {
        updated[student.id] = { ...updated[student.id], status: 'present' }
      }
      return updated
    })
  }

  const handleSave = async () => {
    // Filter only students with a status selected
    const toSave = students
      .filter(s => records[s.id]?.status)
      .map(s => ({
        profile_id: s.id,
        status: records[s.id].status!,
        notes: records[s.id].notes || undefined,
      }))

    if (toSave.length === 0) {
      toast.error('Seleziona almeno uno stato per salvare')
      return
    }

    setSaving(true)
    const result = await saveAttendance(lessonId, toSave)
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Presenze salvate con successo')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{students.length} studenti</p>
        <Button variant="outline" size="sm" onClick={markAllPresent}>
          Segna tutti presenti
        </Button>
      </div>

      <div className="space-y-3">
        {students.map(student => {
          const record = records[student.id]
          return (
            <Card key={student.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="font-medium">{student.full_name}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {STATUSES.map(status => {
                        const config = STATUS_CONFIG[status]
                        const isActive = record?.status === status
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setStatus(student.id, status)}
                            className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                              isActive ? config.active : config.inactive
                            } hover:opacity-80`}
                          >
                            {config.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <Input
                    placeholder="Note..."
                    value={record?.notes || ''}
                    onChange={e => setNotes(student.id, e.target.value)}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvataggio...' : 'Salva presenze'}
        </Button>
      </div>
    </div>
  )
}
