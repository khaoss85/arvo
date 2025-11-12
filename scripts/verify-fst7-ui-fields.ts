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
  console.error('❌ Error: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyUIFields() {
  console.log('🔍 Verifying FST-7 UI-required fields...\n')

  try {
    const { data, error } = await supabase
      .from('training_approaches')
      .select('*')
      .eq('name', 'FST-7 (Hany Rambod)')
      .single()

    if (error) {
      console.error('❌ Error fetching FST-7:', error)
      process.exit(1)
    }

    if (!data) {
      console.error('❌ FST-7 approach not found in database')
      process.exit(1)
    }

    console.log('✅ FST-7 found. Checking UI-required fields:\n')

    const variables = data.variables as any

    // Check setsPerExercise.working
    console.log('📋 setsPerExercise.working:', variables?.setsPerExercise?.working ?? '❌ MISSING')
    console.log('   Expected: number')
    console.log('   Got:', typeof variables?.setsPerExercise?.working)
    console.log()

    // Check repRanges.compound
    console.log('📋 repRanges.compound:', variables?.repRanges?.compound ?? '❌ MISSING')
    console.log('   Expected: [number, number]')
    console.log('   Got:', Array.isArray(variables?.repRanges?.compound) ? `[${variables.repRanges.compound.join(', ')}]` : 'NOT AN ARRAY')
    console.log()

    // Check repRanges.isolation
    console.log('📋 repRanges.isolation:', variables?.repRanges?.isolation ?? '❌ MISSING')
    console.log('   Expected: [number, number]')
    console.log('   Got:', Array.isArray(variables?.repRanges?.isolation) ? `[${variables.repRanges.isolation.join(', ')}]` : 'NOT AN ARRAY')
    console.log()

    // Check rirTarget.normal
    console.log('📋 rirTarget.normal:', variables?.rirTarget?.normal ?? '❌ MISSING')
    console.log('   Expected: number')
    console.log('   Got:', typeof variables?.rirTarget?.normal)
    console.log()

    // Check rirTarget.intense
    console.log('📋 rirTarget.intense:', variables?.rirTarget?.intense ?? '❌ MISSING')
    console.log('   Expected: number')
    console.log('   Got:', typeof variables?.rirTarget?.intense)
    console.log()

    // Check rirTarget.deload
    console.log('📋 rirTarget.deload:', variables?.rirTarget?.deload ?? '❌ MISSING')
    console.log('   Expected: number')
    console.log('   Got:', typeof variables?.rirTarget?.deload)
    console.log()

    // Check tempo object
    console.log('📋 tempo.eccentric:', variables?.tempo?.eccentric ?? '❌ MISSING')
    console.log('   Expected: number')
    console.log('   Got:', typeof variables?.tempo?.eccentric)
    console.log()

    console.log('📋 tempo.pauseBottom:', variables?.tempo?.pauseBottom ?? '❌ MISSING')
    console.log('   Expected: number')
    console.log('   Got:', typeof variables?.tempo?.pauseBottom)
    console.log()

    console.log('📋 tempo.concentric:', variables?.tempo?.concentric ?? '❌ MISSING')
    console.log('   Expected: number')
    console.log('   Got:', typeof variables?.tempo?.concentric)
    console.log()

    console.log('📋 tempo.pauseTop:', variables?.tempo?.pauseTop ?? '❌ MISSING')
    console.log('   Expected: number')
    console.log('   Got:', typeof variables?.tempo?.pauseTop)
    console.log()

    // Summary
    const allFieldsPresent =
      variables?.setsPerExercise?.working !== undefined &&
      Array.isArray(variables?.repRanges?.compound) &&
      Array.isArray(variables?.repRanges?.isolation) &&
      typeof variables?.rirTarget?.normal === 'number' &&
      typeof variables?.rirTarget?.intense === 'number' &&
      typeof variables?.rirTarget?.deload === 'number' &&
      typeof variables?.tempo?.eccentric === 'number' &&
      typeof variables?.tempo?.pauseBottom === 'number' &&
      typeof variables?.tempo?.concentric === 'number' &&
      typeof variables?.tempo?.pauseTop === 'number'

    if (allFieldsPresent) {
      console.log('\n✅ All UI-required fields are present and correctly typed!')
      console.log('🎯 FST-7 should display correctly in the settings page')
    } else {
      console.log('\n⚠️  Some UI-required fields are missing or incorrectly typed')
      console.log('❌ FST-7 may show "N/A" or "undefined" in the settings page')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

verifyUIFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
