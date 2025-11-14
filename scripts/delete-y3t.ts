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

async function deleteY3T() {
  console.log('🗑️  Deleting existing Y3T entry...')

  const { error } = await supabase
    .from('training_approaches')
    .delete()
    .eq('name', 'Y3T (Yoda 3 Training - Neil Hill)')

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('✅ Y3T entry deleted successfully')
}

deleteY3T()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
