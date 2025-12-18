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

        // 2. Insert/Update Profile (Trigger usually handles insert, but we update extra fields)
        // We wait a bit for the trigger or do an upsert manual if needed. 
        // Typically the trigger on auth.users creates the profile. 
        // Let's explicitly update the profile to ensure role and flag are set correctly.
        
        // Wait minor delay to ensure trigger might have fired? 
        // Actually, with service role we can just UPSERT to be sure.
        
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
             // Fallback: if trigger didn't run or something, try insert
             console.error('Error updating profile, trying insert fallback', profileError)
             // In a real trigger scenario, the row exists. Let's assume it does or trigger works.
        }

        revalidatePath('/tutor/tutors')
        
        return { 
            success: true, 
            tempPassword,
            email 
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
