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

async function verifyMountainDog() {
  console.log('🔍 Verifying Mountain Dog Training approach...\n')

  const { data, error } = await supabase
    .from('training_approaches')
    .select('*')
    .eq('name', 'Mountain Dog Training (John Meadows)')
    .single()

  if (error) {
    console.error('❌ Error fetching approach:', error)
    process.exit(1)
  }

  if (!data) {
    console.error('❌ Mountain Dog approach not found in database')
    process.exit(1)
  }

  console.log('✅ Mountain Dog Training found in database!\n')
  console.log('📊 Basic Information:')
  console.log(`  ID: ${data.id}`)
  console.log(`  Name: ${data.name}`)
  console.log(`  Creator: ${data.creator}`)
  console.log(`  Created: ${data.created_at}`)

  console.log('\n🔧 Field Completeness:')
  const fields = [
    'philosophy',
    'variables',
    'progression_rules',
    'exercise_rules',
    'rationales',
    'volume_landmarks',
    'frequency_guidelines',
    'advanced_techniques',
    'split_variations',
    'periodization',
    'rom_emphasis',
    'exercise_selection_principles',
    'stimulus_to_fatigue'
  ]

  let presentCount = 0
  fields.forEach((field) => {
    const isPresent = data[field] !== null && data[field] !== undefined
    console.log(`  ${isPresent ? '✅' : '❌'} ${field}`)
    if (isPresent) presentCount++
  })

  const completeness = Math.round((presentCount / fields.length) * 100)
  console.log(`\n📈 Completeness: ${completeness}% (${presentCount}/${fields.length} fields)`)

  console.log('\n🏔️  Mountain Dog Unique Features:')
  const variables = data.variables as any
  const progression = data.progression_rules as any
  const volumeLandmarks = data.volume_landmarks as any
  const rationales = data.rationales as any

  // Check RIR Target
  if (variables?.rirTarget) {
    console.log(`  ✅ RIR Target Values:`)
    console.log(`     Normal: ${variables.rirTarget.normal} RIR`)
    console.log(`     Intense: ${variables.rirTarget.intense} RIR`)
    console.log(`     Deload: ${variables.rirTarget.deload} RIR`)
  } else {
    console.log(`  ❌ RIR Target: MISSING`)
  }

  // Check progression.priority
  if (progression?.priority) {
    console.log(`  ✅ Progression Priority: ${progression.priority}`)
  } else {
    console.log(`  ❌ Progression Priority: MISSING`)
  }

  // Check volumeLandmarks.muscleGroups
  if (volumeLandmarks?.muscleGroups) {
    const muscleCount = Object.keys(volumeLandmarks.muscleGroups).length
    console.log(`  ✅ Volume Landmarks (MEV/MAV/MRV): ${muscleCount} muscle groups defined`)
    console.log(`     Example (Chest): MEV ${volumeLandmarks.muscleGroups.chest?.mev}, MAV ${volumeLandmarks.muscleGroups.chest?.mav}, MRV ${volumeLandmarks.muscleGroups.chest?.mrv}`)
  } else {
    console.log(`  ❌ Volume Landmarks (muscleGroups): MISSING`)
  }

  // Check rationales structure
  if (rationales) {
    const isFlat = typeof rationales.volumeLandmarks === 'string'
    if (isFlat) {
      console.log(`  ✅ Rationales Structure: Flat (correct)`)
    } else {
      console.log(`  ❌ Rationales Structure: Nested objects (incorrect)`)
    }
  }

  if (variables?.phaseStructure?.phases) {
    console.log(`  ✅ 4-Phase Structure: ${variables.phaseStructure.phases.length} phases defined`)
    variables.phaseStructure.phases.forEach((phase: any) => {
      console.log(`     Phase ${phase.order}: ${phase.name}`)
    })
  }

  if (variables?.accommodatingResistance) {
    console.log(`  ✅ Accommodating Resistance (Chains/Bands) protocol defined`)
  }

  if (variables?.loadedStretchingProtocol) {
    console.log(`  ✅ Loaded Stretching Protocol defined`)
    console.log(`     Duration: ${variables.loadedStretchingProtocol.execution?.duration}`)
  }

  if (progression?.deloadPhilosophy?.stance) {
    console.log(`  ✅ Deload Policy: ${progression.deloadPhilosophy.stance}`)
  }

  if (progression?.blockLength) {
    console.log(`  ✅ Periodization: ${progression.blockLength} blocks`)
  }

  console.log('\n✨ Verification complete!')
}

verifyMountainDog()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
