import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMigration() {
  console.log('🔍 Verificando schema sets_log...\n')

  try {
    // Try to query with new columns to verify they exist
    const { data, error } = await supabase
      .from('sets_log')
      .select('id, set_type, skipped, skip_reason')
      .limit(1)

    if (error) {
      console.error('❌ Errore nella query:', error.message)
      console.error('\n⚠️  Possibili cause:')
      console.error('   - Le colonne non sono state create')
      console.error('   - Permessi RLS non configurati')
      console.error('   - Migration non applicata correttamente\n')
      return false
    }

    console.log('✅ Schema verificato! Le colonne esistono e sono accessibili:')
    console.log('   - set_type: ✓')
    console.log('   - skipped: ✓')
    console.log('   - skip_reason: ✓')

    // Test insert di un set skippato
    console.log('\n🧪 Test insert set skippato...')
    const { data: insertData, error: insertError } = await supabase
      .from('sets_log')
      .insert({
        workout_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        exercise_name: 'Test Exercise',
        set_number: 1,
        set_type: 'warmup',
        skipped: true,
        skip_reason: 'test_verification',
        weight_actual: null,
        reps_actual: null,
        rir_actual: null,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23503') {
        console.log('   ⚠️  Foreign key constraint (normale - workout_id non esiste)')
        console.log('   ✓  Ma la struttura della tabella è corretta!')
      } else if (insertError.code === '42501') {
        console.log('   ⚠️  RLS policy block (normale - non autenticato)')
        console.log('   ✓  Ma la struttura della tabella è corretta!')
      } else {
        console.error('   ❌ Errore imprevisto:', insertError.message)
        return false
      }
    } else {
      console.log('   ✓  Insert di test riuscito!')
      // Cleanup
      if (insertData?.id) {
        await supabase.from('sets_log').delete().eq('id', insertData.id)
      }
    }

    console.log('\n✨ Migration applicata correttamente!\n')
    console.log('📊 Prossimi passi:')
    console.log('   1. La struttura del database è pronta')
    console.log('   2. Puoi testare la feature di skip warmup')
    console.log('   3. Le analytics saranno disponibili dai prossimi workout\n')

    return true
  } catch (err: any) {
    console.error('❌ Errore durante la verifica:', err.message)
    return false
  }
}

verifyMigration().then(success => {
  process.exit(success ? 0 : 1)
}).catch(err => {
  console.error('❌ Errore:', err.message)
  process.exit(1)
})
