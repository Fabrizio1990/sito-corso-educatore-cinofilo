'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CategoryUpdate {
  id: string
  sort_order: number
}

export async function updateCategoryOrder(courseId: string, updates: CategoryUpdate[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify user is tutor or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'tutor' && profile.role !== 'admin')) {
    throw new Error('Unauthorized')
  }

  try {
    // Perform updates in parallel
    const start = Date.now()
    console.log('Starting category update for course:', courseId)

    const results = await Promise.all(
      updates.map(async (update) => {
        const { error, count } = await supabase
          .from('material_categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .select() // Select is needed to return count in some cases or verify return

        if (error) {
          console.error(`Failed to update category ${update.id}:`, error)
          return { success: false, error }
        }
        return { success: true }
      })
    )

    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
      console.error('Some updates failed:', failures)
      return { success: false, error: 'Partial update failure' }
    }

    console.log('All updates successful, revalidating path...')
    revalidatePath(`/tutor/courses/${courseId}`)
    console.log('Update took:', Date.now() - start, 'ms')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating category order:', error)
    return { success: false, error: 'Failed to update order' }
  }
}
