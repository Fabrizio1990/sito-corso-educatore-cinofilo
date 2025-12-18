import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'
import { ForcedPasswordChange } from '@/components/auth/forced-password-change'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(permissions)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // FORCE CHANGE PASSWORD: If required, render ONLY the change password modal
  // We allow navigation on the profile page itself to avoid loops if they are already there?
  // Actually, we want to block them everywhere UNTIL they change it.
  // But if we block them on /profile, they can't scroll down? 
  // The component ForcedPasswordChange is a full-screen overlay (fixed inset-0).
  // So we can just render it. It overlaps everything.
  // Ideally, we shouldn't render the dashboard nav if blocked.

  if (profile.change_password_required) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {/* We render just the forced change password component */}
        {/* We pass nothing because it sets everything up */}
        <ForcedPasswordChange />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav profile={profile} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
