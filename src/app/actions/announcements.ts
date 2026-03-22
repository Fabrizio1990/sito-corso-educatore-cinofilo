'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getTutorOrAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorizzato' as const, supabase: null, user: null }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || (profile.role !== 'tutor' && profile.role !== 'admin')) {
        return { error: 'Non autorizzato' as const, supabase: null, user: null }
    }

    return { error: null, supabase, user }
}

function revalidateAnnouncementPaths() {
    revalidatePath('/tutor/announcements')
    revalidatePath('/dashboard/student/announcements')
}

export async function createAnnouncement(formData: FormData) {
    const { error, supabase, user } = await getTutorOrAdmin()
    if (error) return { error }

    const title = formData.get('title') as string
    const body = formData.get('body') as string
    const priority = formData.get('priority') as 'normal' | 'important' | 'urgent'
    const classId = formData.get('class_id') as string | null
    const courseId = formData.get('course_id') as string | null
    const pinned = formData.get('pinned') === 'true'

    if (!title || !body) {
        return { error: 'Titolo e contenuto sono obbligatori' }
    }

    try {
        const { data, error: insertError } = await supabase!
            .from('announcements')
            .insert({
                title,
                body,
                priority: priority || 'normal',
                class_id: classId || null,
                course_id: courseId || null,
                pinned,
                author_id: user!.id,
            })
            .select()
            .single()

        if (insertError) throw insertError

        revalidateAnnouncementPaths()
        return { data }
    } catch (err: any) {
        console.error('Create Announcement Error:', err)
        return { error: err.message || 'Errore durante la creazione dell\'annuncio' }
    }
}

export async function updateAnnouncement(id: string, formData: FormData) {
    const { error, supabase } = await getTutorOrAdmin()
    if (error) return { error }

    const title = formData.get('title') as string
    const body = formData.get('body') as string
    const priority = formData.get('priority') as 'normal' | 'important' | 'urgent'
    const classId = formData.get('class_id') as string | null
    const courseId = formData.get('course_id') as string | null
    const pinned = formData.get('pinned') === 'true'

    if (!title || !body) {
        return { error: 'Titolo e contenuto sono obbligatori' }
    }

    try {
        const { data, error: updateError } = await supabase!
            .from('announcements')
            .update({
                title,
                body,
                priority: priority || 'normal',
                class_id: classId || null,
                course_id: courseId || null,
                pinned,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) throw updateError

        revalidateAnnouncementPaths()
        return { data }
    } catch (err: any) {
        console.error('Update Announcement Error:', err)
        return { error: err.message || 'Errore durante l\'aggiornamento dell\'annuncio' }
    }
}

export async function deleteAnnouncement(id: string) {
    const { error, supabase } = await getTutorOrAdmin()
    if (error) return { error }

    try {
        const { error: deleteError } = await supabase!
            .from('announcements')
            .delete()
            .eq('id', id)

        if (deleteError) throw deleteError

        revalidateAnnouncementPaths()
        return { success: true }
    } catch (err: any) {
        console.error('Delete Announcement Error:', err)
        return { error: err.message || 'Errore durante l\'eliminazione dell\'annuncio' }
    }
}

export async function markAnnouncementRead(announcementId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorizzato' }

    try {
        const { error: upsertError } = await supabase
            .from('announcement_reads')
            .upsert(
                {
                    announcement_id: announcementId,
                    profile_id: user.id,
                },
                { onConflict: 'announcement_id,profile_id' }
            )

        if (upsertError) throw upsertError

        revalidateAnnouncementPaths()
        return { success: true }
    } catch (err: any) {
        console.error('Mark Announcement Read Error:', err)
        return { error: err.message || 'Errore durante la marcatura dell\'annuncio come letto' }
    }
}
