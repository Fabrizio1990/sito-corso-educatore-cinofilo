import { createClient } from '@/lib/supabase/server'
import { StudentManager } from '@/components/student/student-manager'
import { redirect } from 'next/navigation'

export default async function StudentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Permission Check
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(permissions)')
        .eq('id', user.id)
        .single()
    
    // Allow if role is admin or tutor. roles table might have permissions but easier to check role name directly 
    // or checks specific permission if we added 'manage_students'. 
    // Since original request said "created and managed by tutor or admin", we check roles.
    if (!['admin', 'tutor'].includes(profile?.role || '')) {
         return <div className="p-8">Accesso negato. Area riservata a Tutor e Admin.</div>
    }

    // Fetch Students
    const { data: students } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gestione Studenti</h1>
                    <p className="text-muted-foreground mt-2">
                        Gestisci gli studenti, assegna classi e monitora gli accessi.
                    </p>
                </div>
            </div>

            <StudentManager students={students || []} />
        </div>
    )
}
