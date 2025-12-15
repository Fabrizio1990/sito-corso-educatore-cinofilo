import { createClient } from '@/lib/supabase/client'

type NotificationType = 'lesson_update' | 'new_material' | 'quiz_feedback'

interface NotificationParams {
  type: NotificationType
  classId?: string
  courseId?: string
  lessonTitle?: string
  materialTitle?: string
  studentEmail?: string
  quizTitle?: string
}

export async function sendNotification(params: NotificationParams) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: params,
    })

    if (error) {
      console.error('Notification error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Notification error:', err)
    return { success: false, error: String(err) }
  }
}

// Helper functions for specific notification types
export async function notifyLessonUpdate(classId: string, lessonTitle: string) {
  return sendNotification({
    type: 'lesson_update',
    classId,
    lessonTitle,
  })
}

export async function notifyNewMaterial(courseId: string, materialTitle: string) {
  return sendNotification({
    type: 'new_material',
    courseId,
    materialTitle,
  })
}

export async function notifyQuizFeedback(studentEmail: string, quizTitle: string) {
  return sendNotification({
    type: 'quiz_feedback',
    studentEmail,
    quizTitle,
  })
}
