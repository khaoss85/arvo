import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkQueue() {
  const { data, error } = await supabase
    .from('workout_generation_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log(`Recent queue entries: ${data?.length || 0}`)
    data?.forEach(entry => {
      console.log(`- ${entry.request_id}: ${entry.status} (${entry.progress_percent}%) - Type: ${entry.context?.type} - Created: ${entry.created_at}`)
    })
  }
}

checkQueue()
