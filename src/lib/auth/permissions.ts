import { Role } from '@/types/database'

export type Permission = 
    | 'manage_own_profile'
    | 'manage_own_dogs'
    | 'view_enrolled_courses'
    | 'view_content'
    | 'take_quiz'
    | 'submit_case_study'
    | 'view_all_courses'
    | 'manage_courses'
    | 'manage_classes'
    | 'manage_lessons'
    | 'manage_content'
    | 'view_student_progress'
    | 'manage_tutors'
    | 'manage_users'

export function hasPermission(permissions: string[] | undefined | null, permission: Permission): boolean {
    if (!permissions) return false
    return permissions.includes(permission)
}

export function hasRolePermission(role: Role, permission: Permission): boolean {
    if (!role || !role.permissions) return false
    const perms = role.permissions as string[]
    return perms.includes(permission)
}
