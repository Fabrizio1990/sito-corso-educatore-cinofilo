import { createClient } from '@/lib/supabase/server'
import { TutorManager } from '@/components/tutor/tutor-manager'

export default async function TutorsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Non autenticato</div>
    }
    
    // Check permissions
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('*, roles(permissions)')
        .eq('id', user?.id)
        .single()

    const permissions = (currentUserProfile?.roles as any)?.permissions as string[] || []
    if (!permissions.includes('manage_tutors')) {
        return <div className="p-8">Accesso negato. Non hai i permessi necessari.</div>
    }

    // Fetch existing tutors
    const { data: tutors } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['tutor', 'admin'])
        .order('full_name')

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Gestione Tutor</h1>
            <p className="text-muted-foreground">
                Gestisci i tutor della piattaforma. Puoi creare nuovi account tutor che dovranno cambiare la password al primo accesso.
            </p>

            <TutorManager tutors={tutors || []} />
        </div>
    )
}
