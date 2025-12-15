'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
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

interface DashboardNavProps {
  profile: Profile
}

export function DashboardNav({ profile }: DashboardNavProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isTutorOrAdmin = profile.role === 'tutor' || profile.role === 'admin'

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="font-bold text-xl text-gray-900">
              Dog Trainer Hub
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
                  <Link href="/dashboard/student/quizzes" className="text-gray-600 hover:text-gray-900">
                    Quiz
                  </Link>
                </>
              )}
            </div>
          </div>

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
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
