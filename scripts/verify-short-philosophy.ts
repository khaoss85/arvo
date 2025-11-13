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

async function verifyShortPhilosophy() {
  console.log('🔍 Verifying short_philosophy field for all approaches...\n')

  try {
    const { data: approaches, error } = await supabase
      .from('training_approaches')
      .select('name, creator, short_philosophy')
      .order('name')

    if (error) {
      console.error('❌ Error fetching approaches:', error)
      process.exit(1)
    }

    if (!approaches || approaches.length === 0) {
      console.log('⚠️  No approaches found in database')
      process.exit(0)
    }

    console.log(`Found ${approaches.length} approaches:\n`)

    approaches.forEach((approach, index) => {
      console.log(`${index + 1}. ${approach.name}`)
      console.log(`   Creator: ${approach.creator || 'N/A'}`)

      if (approach.short_philosophy) {
        const wordCount = approach.short_philosophy.split(' ').length
        console.log(`   ✅ short_philosophy: ${wordCount} words`)
        console.log(`   "${approach.short_philosophy.substring(0, 100)}${approach.short_philosophy.length > 100 ? '...' : ''}"`)
      } else {
        console.log(`   ❌ short_philosophy: NOT SET`)
      }
      console.log()
    })

    const withShortPhil = approaches.filter(a => a.short_philosophy).length
    const withoutShortPhil = approaches.length - withShortPhil

    console.log('📊 Summary:')
    console.log(`   ✅ With short_philosophy: ${withShortPhil}/${approaches.length}`)
    console.log(`   ❌ Without short_philosophy: ${withoutShortPhil}/${approaches.length}`)

    if (withoutShortPhil > 0) {
      console.log('\n⚠️  Some approaches are missing short_philosophy. Re-run their seed scripts.')
    } else {
      console.log('\n🎉 All approaches have short_philosophy set!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

verifyShortPhilosophy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
