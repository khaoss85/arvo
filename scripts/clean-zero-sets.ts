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

interface TargetVolume {
  [muscleGroup: string]: number
}

interface Session {
  day: number
  name: string
  workoutType: string
  variation: string
  focus: string[]
  targetVolume: TargetVolume
  principles: string[]
  exampleExercises?: string[]
}

interface SplitPlan {
  id: string
  user_id: string
  split_type: string
  sessions: Session[]
  frequency_map: Record<string, number>
  volume_distribution: Record<string, number>
}

function removeZeroSets(obj: Record<string, number>): Record<string, number> {
  const cleaned: Record<string, number> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value > 0) {
      cleaned[key] = value
    }
  }
  return cleaned
}

async function cleanZeroSets() {
  console.log('🧹 Cleaning muscle groups with 0 sets from split plans...\n')

  try {
    // Fetch all split plans
    const { data: splits, error: fetchError } = await supabase
      .from('split_plans')
      .select('*')

    if (fetchError) {
      console.error('❌ Error fetching split plans:', fetchError)
      process.exit(1)
    }

    if (!splits || splits.length === 0) {
      console.log('ℹ️  No split plans found in database')
      return
    }

    console.log(`📊 Found ${splits.length} split plans to analyze\n`)

    let updatedCount = 0
    let zeroSetsFound = 0

    for (const split of splits as SplitPlan[]) {
      let needsUpdate = false
      const updates: any = {}

      // Clean frequency_map
      if (split.frequency_map) {
        const originalSize = Object.keys(split.frequency_map).length
        const cleaned = removeZeroSets(split.frequency_map)
        const newSize = Object.keys(cleaned).length

        if (originalSize !== newSize) {
          needsUpdate = true
          updates.frequency_map = cleaned
          const removed = originalSize - newSize
          zeroSetsFound += removed
          console.log(`   🔍 Split ${split.id.substring(0, 8)}... - Removed ${removed} muscle groups with 0 frequency from frequency_map`)
        }
      }

      // Clean volume_distribution
      if (split.volume_distribution) {
        const originalSize = Object.keys(split.volume_distribution).length
        const cleaned = removeZeroSets(split.volume_distribution)
        const newSize = Object.keys(cleaned).length

        if (originalSize !== newSize) {
          needsUpdate = true
          updates.volume_distribution = cleaned
          const removed = originalSize - newSize
          zeroSetsFound += removed
          console.log(`   🔍 Split ${split.id.substring(0, 8)}... - Removed ${removed} muscle groups with 0 volume from volume_distribution`)
        }
      }

      // Clean targetVolume in each session
      if (split.sessions && Array.isArray(split.sessions)) {
        const cleanedSessions = split.sessions.map(session => {
          const originalSize = Object.keys(session.targetVolume || {}).length
          const cleanedTargetVolume = removeZeroSets(session.targetVolume || {})
          const newSize = Object.keys(cleanedTargetVolume).length

          if (originalSize !== newSize) {
            needsUpdate = true
            const removed = originalSize - newSize
            zeroSetsFound += removed
            console.log(`   🔍 Split ${split.id.substring(0, 8)}... - Session "${session.name}" - Removed ${removed} muscle groups with 0 sets`)
          }

          return {
            ...session,
            targetVolume: cleanedTargetVolume
          }
        })

        if (needsUpdate) {
          updates.sessions = cleanedSessions
        }
      }

      // Update database if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('split_plans')
          .update(updates)
          .eq('id', split.id)

        if (updateError) {
          console.error(`   ❌ Error updating split ${split.id}:`, updateError)
        } else {
          updatedCount++
          console.log(`   ✅ Updated split ${split.id.substring(0, 8)}...\n`)
        }
      }
    }

    console.log('='.repeat(60))
    console.log('📈 Summary:')
    console.log(`   Total split plans analyzed: ${splits.length}`)
    console.log(`   Split plans with 0-set groups: ${updatedCount}`)
    console.log(`   Total muscle groups with 0 sets removed: ${zeroSetsFound}`)
    console.log('='.repeat(60) + '\n')

    if (updatedCount > 0) {
      console.log('✅ Successfully cleaned all split plans!')
    } else {
      console.log('✅ No split plans needed cleaning - all clean!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

cleanZeroSets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Cleaning failed:', error)
    process.exit(1)
  })
