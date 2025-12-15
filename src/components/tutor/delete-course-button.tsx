'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DeleteCourseButtonProps {
  courseId: string
  courseName: string
}

export function DeleteCourseButton({ courseId, courseName }: DeleteCourseButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    // Check if course has classes
    const { count } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    if (count && count > 0) {
      setError('Non puoi eliminare un corso che ha classi associate. Elimina prima le classi.')
      setLoading(false)
      return
    }

    // Delete materials
    await supabase.from('materials').delete().eq('course_id', courseId)

    // Delete quizzes and submissions
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId)

    if (quizzes) {
      for (const quiz of quizzes) {
        await supabase.from('quiz_submissions').delete().eq('quiz_id', quiz.id)
      }
    }
    await supabase.from('quizzes').delete().eq('course_id', courseId)

    // Delete course
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setLoading(false)
    router.push('/tutor/courses')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          Elimina corso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Elimina corso</DialogTitle>
          <DialogDescription>
            Sei sicuro di voler eliminare il corso &quot;{courseName}&quot;?
            Verranno eliminati anche tutti i materiali e quiz associati.
            Questa azione non può essere annullata.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Eliminazione...' : 'Elimina'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
