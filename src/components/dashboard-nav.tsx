'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { getAccounts, removeAccount, saveAccount, type StoredAccount } from '@/lib/account-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/notification-bell'

interface DashboardNavProps {
  profile: Profile & { roles: { permissions: unknown } | null }
  pendingQuizCount?: number
}

export function DashboardNav({ profile, pendingQuizCount }: DashboardNavProps) {
  const [mounted, setMounted] = useState(false)
  const [otherAccounts, setOtherAccounts] = useState<StoredAccount[]>([])
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Parse permissions safely
  const permissions = (profile.roles?.permissions as string[]) || []

  // Helper for check
  const can = (permission: string) => permissions.includes(permission)

  useEffect(() => {
    setMounted(true)
    const accounts = getAccounts().filter(a => a.email !== profile.email)
    setOtherAccounts(accounts)

    // Keep tokens updated in store when Supabase refreshes them
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        const existing = getAccounts().find(a => a.email === session.user.email)
        if (existing) {
          saveAccount({
            ...existing,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            updated_at: Date.now(),
          })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [profile.email, supabase.auth])

  const handleSwitchAccount = async (account: StoredAccount) => {
    setSwitchingTo(account.email)
    try {
      const { error } = await supabase.auth.setSession({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
      })
      if (error) {
        // Token expired, remove from store and prompt re-login
        removeAccount(account.email)
        setOtherAccounts(prev => prev.filter(a => a.email !== account.email))
        alert(`Sessione scaduta per ${account.email}. Effettua di nuovo il login con quell'account.`)
        setSwitchingTo(null)
        return
      }
      // Reload the page to pick up the new session
      window.location.href = '/dashboard'
    } catch {
      setSwitchingTo(null)
    }
  }

  const handleLogout = async () => {
    // Keep account in store for switching back later
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Use permissions for main tutor dashboard access
  // Technically "view_all_courses" is a good proxy for "Is Tutor/Admin"
  const isTutorOrAdmin = can('view_all_courses')

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="font-bold text-xl text-gray-900">
              <span className="md:hidden">DTH</span>
              <span className="hidden md:inline">Dog Trainer Hub</span>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              {isTutorOrAdmin ? (
                <>
                  <Link href="/tutor" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link href="/tutor/courses" className="text-gray-600 hover:text-gray-900">
                    Corsi
                  </Link>
                  <Link href="/tutor/classes" className="text-gray-600 hover:text-gray-900">
                    Classi
                  </Link>
                  <Link href="/tutor/materials" className="text-gray-600 hover:text-gray-900">
                    Materiali
                  </Link>
                  <Link href="/tutor/exercises" className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                    Esercizi
                    {(pendingQuizCount || 0) > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-medium">
                        {pendingQuizCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/tutor/announcements" className="text-gray-600 hover:text-gray-900">
                    Bacheca
                  </Link>

                  {can('manage_tutors') ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-gray-600 hover:text-gray-900 p-0 font-normal hover:bg-transparent">
                          Amministrazione
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Gestione Utenti</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href="/tutor/tutors">Gestione Tutor</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/tutor/students">Gestione Studenti</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link href="/tutor/students" className="text-gray-600 hover:text-gray-900">
                      Studenti
                    </Link>
                  )}
                  <Link href="/guide" className="text-gray-600 hover:text-gray-900">
                    Guida
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard/student" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/student/lessons" className="text-gray-600 hover:text-gray-900">
                    Lezioni
                  </Link>
                  <Link href="/dashboard/student/materials" className="text-gray-600 hover:text-gray-900">
                    Materiali
                  </Link>
                  <Link href="/dashboard/student/exercises" className="text-gray-600 hover:text-gray-900">
                    Esercizi
                  </Link>
                  <Link href="/dashboard/student/announcements" className="text-gray-600 hover:text-gray-900">
                    Bacheca
                  </Link>
                  <Link href="/dashboard/student/progress" className="text-gray-600 hover:text-gray-900">
                    Progressi
                  </Link>
                  <Link href="/guide" className="text-gray-600 hover:text-gray-900">
                    Guida
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
          {mounted && <NotificationBell />}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {profile.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">Il mio profilo</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/guide">Guida</Link>
                </DropdownMenuItem>
                {otherAccounts.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Cambia account
                    </DropdownMenuLabel>
                    {otherAccounts.map((account) => (
                      <DropdownMenuItem
                        key={account.email}
                        onClick={() => handleSwitchAccount(account)}
                        className="cursor-pointer"
                        disabled={switchingTo === account.email}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {account.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm">{account.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {switchingTo === account.email ? 'Cambio in corso...' : account.role}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          )}
          </div>
        </div>
      </div>
    </nav>
  )
}
