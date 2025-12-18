import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(permissions)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const permissions = (profile.roles as any)?.permissions as string[] || []

  // Redirect based on permission (Tutors/Admins have view_all_courses)
  if (permissions.includes('view_all_courses')) {
    redirect('/tutor')
  }

  // Student dashboard - redirect to student page
  redirect('/dashboard/student')
}
