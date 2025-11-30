'use server'

import { getUser } from '@/lib/utils/auth.server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Reset User Data
 * Deletes all user-specific data while keeping the auth account intact.
 * Useful for testing/development - allows re-running onboarding without re-registering.
 */
export async function resetUserData() {
  const user = await getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const supabase = await getSupabaseServerClient()

  try {
    // Delete user-specific data
    // Note: CASCADE rules will automatically delete child records (sets_log, etc.)

    // 1. Delete progress photos from storage (must be done before deleting DB records)
    const { data: userFolders } = await supabase.storage
      .from('progress-photos')
      .list(user.id)

    if (userFolders && userFolders.length > 0) {
      // List all files in user's folder recursively
      const filesToDelete: string[] = []
      for (const folder of userFolders) {
        if (folder.name) {
          const { data: checkPhotos } = await supabase.storage
            .from('progress-photos')
            .list(`${user.id}/${folder.name}`)

          if (checkPhotos) {
            filesToDelete.push(...checkPhotos.map(f => `${user.id}/${folder.name}/${f.name}`))
          }
        }
      }

      if (filesToDelete.length > 0) {
        await supabase.storage.from('progress-photos').remove(filesToDelete)
      }
    }

    // 2. Delete progress_checks (CASCADE will delete progress_photos and body_measurements records)
    const { error: checksError } = await supabase
      .from('progress_checks')
      .delete()
      .eq('user_id', user.id)

    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)

    const { error: splitsError } = await supabase
      .from('split_plans')
      .delete()
      .eq('user_id', user.id)

    const { error: workoutsError } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', user.id)

    const { error: exercisesError } = await supabase
      .from('exercise_generations')
      .delete()
      .eq('user_id', user.id)

    // Check for errors (ignore "no rows" errors)
    const errors = [checksError, profileError, splitsError, workoutsError, exercisesError].filter(e => e !== null)

    if (errors.length > 0) {
      console.error('Errors during data reset:', errors)
      throw new Error('Failed to reset some data. Check logs for details.')
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return { success: true }
  } catch (error) {
    console.error('Data reset error:', error)
    throw error
  }
}

/**
 * Delete Account (Complete)
 * Permanently deletes the user account from Supabase Auth.
 * ALL associated data is automatically deleted via CASCADE rules:
 * - user_profiles
 * - split_plans
 * - workouts
 * - sets_log (via workouts CASCADE)
 * - exercise_generations
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be configured.
 */
export async function deleteAccount() {
  const user = await getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if service role key is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Account deletion requires service role key configuration. Contact administrator.')
  }

  try {
    // Import admin client dynamically (only if service key exists)
    const { getSupabaseAdmin } = await import('@/lib/supabase/admin')
    const admin = getSupabaseAdmin()

    // Delete user from auth.users
    // CASCADE rules will automatically delete all associated data
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('Account deletion error:', error)
      throw new Error(`Failed to delete account: ${error.message}`)
    }

    // Log deletion for audit trail (optional - can be sent to external logging service)
    console.log(`Account deleted: ${user.id} (${user.email}) at ${new Date().toISOString()}`)

  } catch (error) {
    console.error('Account deletion error:', error)
    throw error
  }

  // Redirect to login with deletion confirmation
  redirect('/login?deleted=true')
}
