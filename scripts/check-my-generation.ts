import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkMyGeneration() {
  const myUserId = '8876430f-4f07-4fda-989c-c6448544473d'

  const { data, error } = await supabaseAdmin
    .from('workout_generation_queue')
    .select('*')
    .eq('user_id', myUserId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Generations for user ${myUserId}:`)
    if (data.length === 0) {
      console.log('  No generations found')
    } else {
      data.forEach(entry => {
        console.log(`\n  ID: ${entry.id}`)
        console.log(`  Request ID: ${entry.request_id}`)
        console.log(`  Status: ${entry.status}`)
        console.log(`  Progress: ${entry.progress_percent}%`)
        console.log(`  Context: ${JSON.stringify(entry.context)}`)
        console.log(`  Created: ${entry.created_at}`)
      })
    }
  }
}

checkMyGeneration()
