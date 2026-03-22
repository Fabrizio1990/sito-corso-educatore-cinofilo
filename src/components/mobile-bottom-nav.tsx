'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/types/database'
import {
  Home,
  Calendar,
  BookOpen,
  FileQuestion,
  User,
  GraduationCap,
  Users,
  MoreHorizontal,
  X,
  ClipboardList,
  UserCog,
  Megaphone,
  HelpCircle,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

interface MobileBottomNavProps {
  profile: Profile & { roles: { permissions: unknown } | null }
  pendingQuizCount?: number
}

interface TabItem {
  label: string
  href: string
  icon: LucideIcon
}

interface MoreMenuItem {
  label: string
  href: string
  icon: LucideIcon
}

export function MobileBottomNav({ profile, pendingQuizCount }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const permissions = (profile.roles?.permissions as string[]) || []
  const isTutorOrAdmin = permissions.includes('view_all_courses')
  const canManageTutors = permissions.includes('manage_tutors')

  // Close the "Altro" drawer when navigating
  useEffect(() => {
    setIsMoreOpen(false)
  }, [pathname])

  // Close drawer on Escape key
  useEffect(() => {
    if (!isMoreOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMoreOpen])

  const studentTabs: TabItem[] = [
    { label: 'Home', href: '/dashboard/student', icon: Home },
    { label: 'Lezioni', href: '/dashboard/student/lessons', icon: Calendar },
    { label: 'Materiali', href: '/dashboard/student/materials', icon: BookOpen },
    { label: 'Quiz', href: '/dashboard/student/quizzes', icon: FileQuestion },
  ]

  const studentMoreItems: MoreMenuItem[] = [
    { label: 'Bacheca', href: '/dashboard/student/announcements', icon: Megaphone },
    { label: 'Casi di Studio', href: '/dashboard/student/case-studies', icon: ClipboardList },
    { label: 'Progressi', href: '/dashboard/student/progress', icon: BarChart3 },
    { label: 'Profilo', href: '/profile', icon: User },
    { label: 'Guida', href: '/guide', icon: HelpCircle },
  ]

  const tutorTabs: TabItem[] = [
    { label: 'Home', href: '/tutor', icon: Home },
    { label: 'Corsi', href: '/tutor/courses', icon: GraduationCap },
    { label: 'Classi', href: '/tutor/classes', icon: Users },
    { label: 'Materiali', href: '/tutor/materials', icon: BookOpen },
  ]

  const tutorMoreItems: MoreMenuItem[] = [
    { label: 'Bacheca', href: '/tutor/announcements', icon: Megaphone },
    { label: 'Quiz', href: '/tutor/quizzes', icon: FileQuestion },
    { label: 'Casi di Studio', href: '/tutor/case-studies', icon: ClipboardList },
    { label: 'Gestione Studenti', href: '/tutor/students', icon: User },
    ...(canManageTutors
      ? [{ label: 'Gestione Tutor', href: '/tutor/tutors', icon: UserCog }]
      : []),
    { label: 'Guida', href: '/guide', icon: HelpCircle },
  ]

  const tabs = isTutorOrAdmin ? tutorTabs : studentTabs

  const isActive = useCallback(
    (href: string) => {
      if (href === '/tutor' || href === '/dashboard/student') {
        return pathname === href
      }
      return pathname.startsWith(href)
    },
    [pathname]
  )

  // Check if any "more" item is currently active
  const moreItems = isTutorOrAdmin ? tutorMoreItems : studentMoreItems
  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href))

  return (
    <>
      {/* Backdrop for "Altro" drawer */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* "Altro" slide-up drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-200 ease-out ${
          isMoreOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu aggiuntivo"
      >
        <div className="bg-white rounded-t-2xl shadow-lg border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Altro</span>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Chiudi menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="py-2">
            {moreItems.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${
                    active
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>
                    {item.label}
                    {item.href === '/tutor/quizzes' && (pendingQuizCount || 0) > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-medium">
                        {pendingQuizCount}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-xs ${active ? 'font-medium' : ''}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}

          {/* "Altro" button */}
          <button
              onClick={() => setIsMoreOpen((prev) => !prev)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
                isMoreActive || isMoreOpen ? 'text-blue-600' : 'text-gray-500'
              }`}
              aria-label="Altro"
              aria-expanded={isMoreOpen}
            >
              <div className="relative">
                <MoreHorizontal size={20} strokeWidth={isMoreActive || isMoreOpen ? 2.5 : 2} />
                {isTutorOrAdmin && (pendingQuizCount || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
              <span className={`text-xs ${isMoreActive || isMoreOpen ? 'font-medium' : ''}`}>
                Altro
              </span>
            </button>
        </div>
      </nav>
    </>
  )
}
