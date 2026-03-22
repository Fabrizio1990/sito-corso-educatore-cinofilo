'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveAttendance(
  lessonId: string,
  records: Array<{ profile_id: string; status: string; notes?: string }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorizzato' }

  // Check tutor/admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'tutor' && profile.role !== 'admin')) {
    return { error: 'Non autorizzato' }
  }

  // Upsert each record
  const { error } = await supabase.from('attendance').upsert(
    records.map(r => ({
      lesson_id: lessonId,
      profile_id: r.profile_id,
      status: r.status,
      notes: r.notes || null,
      marked_by: user.id,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'lesson_id,profile_id' }
  )

  if (error) return { error: error.message }

  revalidatePath('/tutor/classes')
  return { success: true }
}
