import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkUser() {
  const userId = '8876430f-4f07-4fda-989c-c6448544473d'

  // Check in auth.users
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

  console.log('Auth User Check:')
  if (authError) {
    console.log('  Error:', authError)
  } else if (authUser?.user) {
    console.log('  ✓ User exists in auth.users')
    console.log('  Email:', authUser.user.email)
    console.log('  Created:', authUser.user.created_at)
  } else {
    console.log('  ✗ User NOT found in auth.users')
  }

  // Check in user_profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  console.log('\nUser Profile Check:')
  if (profileError) {
    console.log('  Error:', profileError.message)
  } else if (profile) {
    console.log('  ✓ Profile exists')
    console.log('  Approach:', profile.approach_id)
  } else {
    console.log('  ✗ Profile NOT found')
  }
}

checkUser()
