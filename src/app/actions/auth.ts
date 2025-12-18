'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const getAdminClient = () => {
    if (!supabaseServiceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function createTutor(formData: FormData) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Non autorizzato' }
    }

    // Check permissions
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(permissions)')
        .eq('id', user.id)
        .single()

    const permissions = (profile?.roles as any)?.permissions as string[] || []
    if (!permissions.includes('manage_tutors')) {
        return { error: 'Non hai i permessi per creare tutor' }
    }

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string

    if (!firstName || !lastName || !email) {
        return { error: 'Tutti i campi sono obbligatori' }
    }

    try {
        const adminClient = getAdminClient()
        // Generate a random temp password
        const tempPassword = `Tutor${Math.random().toString(36).slice(-6)}!`

        // 1. Create User in Auth
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: `${firstName} ${lastName}`.trim(),
                role: 'tutor'
            }
        })

        if (createError) throw createError

        // 2. Update Profile Role & Security Flag
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`.trim(),
                role: 'tutor',
                change_password_required: true 
            })
            .eq('id', userData.user.id)

        if (profileError) {
             console.error('Error updating profile role:', profileError)
        }

        revalidatePath('/tutor/tutors')
        
        return { 
            success: true, 
            email,
            tempPassword
        }

    } catch (error: any) {
        console.error('Create Tutor Error:', error)
        return { error: error.message || 'Errore durante la creazione del tutor' }
    }
}

export async function changePassword(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Le password non coincidono' }
    }

    if (password.length < 6) {
        return { error: 'La password deve essere di almeno 6 caratteri' }
    }

    const supabase = await createServerClient()
    
    try {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error

        // Update the flag
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase
                .from('profiles')
                .update({ change_password_required: false })
                .eq('id', user.id)
        }

        revalidatePath('/profile')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function toggleTutorStatus(userId: string, shouldDisable: boolean) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorizzato' }

    // Check permissions
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(permissions)')
        .eq('id', user.id)
        .single()

    const permissions = (profile?.roles as any)?.permissions as string[] || []
    if (!permissions.includes('manage_tutors')) {
        return { error: 'Non hai i permessi per gestire i tutor' }
    }

    const adminClient = getAdminClient()

    try {
        if (shouldDisable) {
            // Ban user for ~100 years
            const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
            if (error) throw error
        } else {
            // Unban
            const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' })
            if (error) throw error
        }

        // Update profile status for UI
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ is_disabled: shouldDisable })
            .eq('id', userId)
        
        if (profileError) throw profileError

        revalidatePath('/tutor/tutors')
        return { success: true }
    } catch (error: any) {
        console.error('Toggle Status Error:', error)
        return { error: error.message }
    }
}

export async function deleteTutor(userId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Non autorizzato' }

    // Check permissions
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(permissions)')
        .eq('id', user.id)
        .single()

    const permissions = (profile?.roles as any)?.permissions as string[] || []
    if (!permissions.includes('manage_tutors')) {
        return { error: 'Non hai i permessi per eliminare i tutor' }
    }

    const adminClient = getAdminClient()

    try {
        const { error } = await adminClient.auth.admin.deleteUser(userId)
        if (error) throw error

        revalidatePath('/tutor/tutors')
        return { success: true }
    } catch (error: any) {
        console.error('Delete Tutor Error:', error)
        return { error: error.message }
    }
}
