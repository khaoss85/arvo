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

async function verifyBothFixes() {
  console.log('🔍 Verifying Y3T and Mountain Dog fixes...\n')

  // Verify Y3T
  const { data: y3t, error: y3tError } = await supabase
    .from('training_approaches')
    .select('*')
    .eq('name', 'Y3T (Yoda 3 Training - Neil Hill)')
    .single()

  if (y3tError || !y3t) {
    console.error('❌ Y3T not found:', y3tError)
    process.exit(1)
  }

  console.log('✅ Y3T Found\n')
  console.log('📋 Y3T Training Frequency Check:')
  const y3tVariables = y3t.variables as any
  if (y3tVariables?.frequency?.muscleGroupDays && y3tVariables?.frequency?.weeklyPattern) {
    console.log(`  ✅ muscleGroupDays: "${y3tVariables.frequency.muscleGroupDays}"`)
    console.log(`  ✅ weeklyPattern: "${y3tVariables.frequency.weeklyPattern}"`)
  } else {
    console.log(`  ❌ Missing fields`)
    console.log(`     muscleGroupDays: ${y3tVariables?.frequency?.muscleGroupDays ? '✅' : '❌'}`)
    console.log(`     weeklyPattern: ${y3tVariables?.frequency?.weeklyPattern ? '✅' : '❌'}`)
  }

  // Verify Mountain Dog
  const { data: mountainDog, error: mdError } = await supabase
    .from('training_approaches')
    .select('*')
    .eq('name', 'Mountain Dog Training (John Meadows)')
    .single()

  if (mdError || !mountainDog) {
    console.error('❌ Mountain Dog not found:', mdError)
    process.exit(1)
  }

  console.log('\n✅ Mountain Dog Found\n')
  console.log('📋 Mountain Dog Advanced Techniques Check:')
  const mdTechniques = mountainDog.advanced_techniques as any

  const techniques = ['chains', 'bands', 'dropSets', 'restPause', 'giantSets', 'mechanicalDropSets', 'loadedStretching', 'tempoVariations']
  let allGood = true

  techniques.forEach(tech => {
    if (mdTechniques?.[tech]) {
      const hasWhen = !!mdTechniques[tech].when
      const hasProtocol = !!mdTechniques[tech].protocol
      const hasFrequency = !!mdTechniques[tech].frequency
      const status = hasWhen && hasProtocol && hasFrequency ? '✅' : '❌'
      console.log(`  ${status} ${tech}: when=${hasWhen ? '✅' : '❌'}, protocol=${hasProtocol ? '✅' : '❌'}, frequency=${hasFrequency ? '✅' : '❌'}`)
      if (!hasWhen || !hasProtocol || !hasFrequency) allGood = false
    } else {
      console.log(`  ❌ ${tech}: MISSING`)
      allGood = false
    }
  })

  console.log('\n✨ Verification complete!')
  console.log(allGood ? '🎉 All fixes verified successfully!' : '⚠️  Some issues remain')
}

verifyBothFixes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
