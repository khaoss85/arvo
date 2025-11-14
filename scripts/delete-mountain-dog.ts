import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteMountainDog() {
  console.log('🗑️  Deleting existing Mountain Dog entry...')

  const { error } = await supabase
    .from('training_approaches')
    .delete()
    .eq('name', 'Mountain Dog Training (John Meadows)')

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('✅ Mountain Dog entry deleted successfully')
}

deleteMountainDog()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
