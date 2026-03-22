'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LessonsClassFilterProps {
  classes: Array<{ id: string; editionName: string; courseName: string }>
}

export function LessonsClassFilter({ classes }: LessonsClassFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedClass = searchParams.get('class') || 'all'

  const handleChange = (value: string) => {
    if (value === 'all') {
      router.push('/dashboard/student/lessons')
    } else {
      router.push(`/dashboard/student/lessons?class=${value}`)
    }
  }

  return (
    <Select value={selectedClass} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-72">
        <SelectValue placeholder="Tutte le classi" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tutte le classi</SelectItem>
        {classes.map(c => (
          <SelectItem key={c.id} value={c.id}>
            {c.courseName} - {c.editionName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
