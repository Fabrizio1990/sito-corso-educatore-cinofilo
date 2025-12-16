'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LessonDialog } from './lesson-dialog'

interface CreateLessonButtonProps {
  classId: string
}

export function CreateLessonButton({ classId }: CreateLessonButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        Nuova Lezione
      </Button>
      <LessonDialog
        classId={classId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
