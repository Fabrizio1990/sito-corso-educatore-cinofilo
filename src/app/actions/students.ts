'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Use a Service Role client for Admin operations
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

async function checkPermissions() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Allow Tutors and Admins
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    
    return ['admin', 'tutor'].includes(profile?.role || '')
}

export async function getStudents(search?: string) {
    if (!await checkPermissions()) return { error: 'Non autorizzato' }

    const supabase = await createServerClient()
    let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query
    
    if (error) return { error: error.message }
    return { data }
}

export async function createStudent(formData: FormData) {
    if (!await checkPermissions()) return { error: 'Non autorizzato' }

    const email = formData.get('email') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    if (!email || !firstName || !lastName) {
        return { error: 'Tutti i campi sono obbligatori' }
    }

    const adminClient = getAdminClient()
    // Generate temp password
    const tempPassword = `Student${Math.random().toString(36).slice(-6)}!`

    try {
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: `${firstName} ${lastName}`.trim(),
                role: 'student'
            }
        })

        if (createError) throw createError

        // Force password change & Ensure profile consistency
        await adminClient
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`.trim(),
                role: 'student',
                change_password_required: true,
                is_disabled: false
            })
            .eq('id', userData.user.id)

        revalidatePath('/tutor/students')

        return { success: true, email, tempPassword }
    } catch (error: any) {
        return { error: error.message || 'Errore creazione studente' }
    }
}

export async function toggleStudentStatus(userId: string, shouldDisable: boolean) {
    if (!await checkPermissions()) return { error: 'Non autorizzato' }
    const adminClient = getAdminClient()

    try {
        if (shouldDisable) {
            await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876000h' }) 
        } else {
            await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' }) 
        }

        await adminClient.from('profiles').update({ is_disabled: shouldDisable }).eq('id', userId)
        revalidatePath('/tutor/students')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteStudent(userId: string) {
    if (!await checkPermissions()) return { error: 'Non autorizzato' }
    const adminClient = getAdminClient()

    try {
        const { error } = await adminClient.auth.admin.deleteUser(userId)
        if (error) throw error
        revalidatePath('/tutor/students')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getStudentClasses(studentId: string) {
    if (!await checkPermissions()) return { error: 'Non autorizzato' }
    const supabase = await createServerClient()
    
    // Get enrolled classes
    const { data: enrolled, error } = await supabase
        .from('class_students')
        .select(`
            class_id,
            classes (
                id,
                edition_name,
                course:courses(name)
            )
        `)
        .eq('profile_id', studentId)

    if (error) return { error: error.message }
    
    // Get all available classes
    const { data: allClasses } = await supabase
        .from('classes')
        .select(`
            id,
            edition_name,
            course:courses(name)
        `)
        .order('start_date', { ascending: false })

    return { 
        enrolled: enrolled?.map(e => ({ 
            ...e.classes, 
            class_id: e.class_id 
        })) || [], 
        allClasses: allClasses || [] 
    }
}

export async function assignStudentToClass(studentId: string, classId: string) {
    if (!await checkPermissions()) return { error: 'Non autorizzato' }
    const supabase = await createServerClient()

    const { error } = await supabase
        .from('class_students')
        .insert({ profile_id: studentId, class_id: classId })

    if (error) {
        if (error.code === '23505') return { error: 'Studente già iscritto a questa classe' }
        return { error: error.message }
    }
    
    revalidatePath('/tutor/students')
    return { success: true }
}

export async function removeStudentFromClass(studentId: string, classId: string) {
    if (!await checkPermissions()) return { error: 'Non autorizzato' }
    const supabase = await createServerClient()

    const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('profile_id', studentId)
        .eq('class_id', classId)

    if (error) return { error: error.message }
    
    revalidatePath('/tutor/students')
    return { success: true }
}
