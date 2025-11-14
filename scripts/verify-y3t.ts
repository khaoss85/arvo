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

async function verifyY3T() {
  console.log('🔍 Verifying Y3T Training approach...\n')

  const { data, error } = await supabase
    .from('training_approaches')
    .select('*')
    .eq('name', 'Y3T (Yoda 3 Training - Neil Hill)')
    .single()

  if (error) {
    console.error('❌ Error fetching approach:', error)
    process.exit(1)
  }

  if (!data) {
    console.error('❌ Y3T approach not found in database')
    process.exit(1)
  }

  console.log('✅ Y3T Training found in database!\n')
  console.log('📊 Basic Information:')
  console.log(`  ID: ${data.id}`)
  console.log(`  Name: ${data.name}`)
  console.log(`  Creator: ${data.creator}`)
  console.log(`  Created: ${data.created_at}`)

  const advancedTechniques = data.advanced_techniques as any
  const periodization = data.periodization as any

  console.log('\n🔧 Critical Fixes Verification:')

  // Check advancedTechniques.supersets structure
  if (advancedTechniques?.supersets) {
    const types = advancedTechniques.supersets.types
    const protocol = advancedTechniques.supersets.protocol

    if (typeof types === 'string' && typeof protocol === 'string') {
      console.log(`  ✅ Advanced Techniques (supersets): Fixed - no nested objects`)
      console.log(`     types: ${typeof types} (string)`)
      console.log(`     protocol: ${typeof protocol} (string)`)
    } else {
      console.log(`  ❌ Advanced Techniques (supersets): STILL HAS NESTED OBJECTS`)
      console.log(`     types: ${typeof types}`)
      console.log(`     protocol: ${typeof protocol}`)
    }
  } else {
    console.log(`  ❌ Advanced Techniques (supersets): MISSING`)
  }

  // Check periodization fields
  if (periodization?.model && periodization?.cycleDuration && periodization?.phases) {
    console.log(`  ✅ Periodization Fields: All present`)
    console.log(`     model: "${periodization.model}"`)
    console.log(`     cycleDuration: "${periodization.cycleDuration}"`)
    console.log(`     phases: ${Object.keys(periodization.phases).length} phases defined`)
  } else {
    console.log(`  ❌ Periodization Fields: MISSING`)
    console.log(`     model: ${periodization?.model ? '✅' : '❌'}`)
    console.log(`     cycleDuration: ${periodization?.cycleDuration ? '✅' : '❌'}`)
    console.log(`     phases: ${periodization?.phases ? '✅' : '❌'}`)
  }

  console.log('\n✨ Verification complete!')
}

verifyY3T()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
