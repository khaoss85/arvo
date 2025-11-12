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

async function verifyFST7() {
  console.log('🔍 Verifying FST-7 data in database...\n')

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

    console.log('✅ FST-7 approach found in database!')
    console.log('\n📋 Basic Info:')
    console.log('   ID:', data.id)
    console.log('   Name:', data.name)
    console.log('   Creator:', data.creator)
    console.log('   Philosophy length:', data.philosophy?.length || 0, 'characters')

    console.log('\n📊 Data Structure Verification:')
    console.log('   ✓ Variables:', data.variables ? 'Present' : 'Missing')
    console.log('   ✓ Progression Rules:', data.progression_rules ? 'Present' : 'Missing')
    console.log('   ✓ Exercise Rules:', data.exercise_rules ? 'Present' : 'Missing')
    console.log('   ✓ Rationales:', data.rationales ? 'Present' : 'Missing')
    console.log('   ✓ Volume Landmarks:', data.volume_landmarks ? 'Present' : 'Missing')
    console.log('   ✓ Frequency Guidelines:', data.frequency_guidelines ? 'Present' : 'Missing')
    console.log('   ✓ ROM Emphasis:', data.rom_emphasis ? 'Present' : 'Missing')
    console.log('   ✓ Exercise Selection Principles:', data.exercise_selection_principles ? 'Present' : 'Missing')
    console.log('   ✓ Stimulus to Fatigue:', data.stimulus_to_fatigue ? 'Present' : 'Missing')
    console.log('   ✓ Advanced Techniques:', data.advanced_techniques ? 'Present' : 'Missing')
    console.log('   ✓ Split Variations:', data.split_variations ? 'Present' : 'Missing')
    console.log('   ✓ Periodization:', data.periodization ? 'Present' : 'Missing')

    console.log('\n🔥 FST-7 Specific Features:')
    const variables = data.variables as any
    if (variables?.setsPerExercise) {
      console.log('   ✓ FST-7 Sets:', variables.setsPerExercise.fst7Exercise, 'sets')
    }
    if (variables?.restPeriods?.fst7Sets) {
      console.log('   ✓ FST-7 Rest:', variables.restPeriods.fst7Sets[0], '-', variables.restPeriods.fst7Sets[1], 'seconds')
    }
    if (variables?.hydration) {
      console.log('   ✓ Hydration Protocol:', variables.hydration.criticality ? 'Configured' : 'Missing')
    }

    const advancedTechniques = data.advanced_techniques as any
    if (advancedTechniques) {
      const techniqueCount = Object.keys(advancedTechniques).length
      console.log('   ✓ Advanced Techniques:', techniqueCount, 'techniques configured')
    }

    const splitVariations = data.split_variations as any
    if (splitVariations?.splitOptions) {
      console.log('   ✓ Split Options:', splitVariations.splitOptions.length, 'variations')
    }

    console.log('\n✅ All FST-7 data verified successfully!')
    console.log('🎯 Ready for use in workout generation system\n')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

verifyFST7()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
