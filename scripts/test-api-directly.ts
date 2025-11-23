import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function testAPIDirectly() {
  // Get an approach
  const { data: approach } = await supabaseAdmin
    .from('training_approaches')
    .select('id')
    .limit(1)
    .single()

  if (!approach) {
    console.error('No approach found')
    return
  }

  console.log('Using approach:', approach.id)

  // Create test user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `test-${Date.now()}@example.com`,
    email_confirm: true
  })

  if (authError || !authData.user) {
    console.error('Failed to create user:', authError)
    return
  }

  const userId = authData.user.id
  console.log('Created user:', userId)

  // Create profile
  await supabaseAdmin.from('user_profiles').insert({
    user_id: userId,
    approach_id: approach.id,
    first_name: 'Test',
    gender: 'male',
    age: 30,
    weight: 80,
    height: 180,
    available_equipment: ['barbell'],
    weak_points: [],
    experience_years: 2
  })

  const requestId = crypto.randomUUID()
  console.log('Request ID:', requestId)

  // Call API
  try {
    const response = await fetch('http://localhost:3000/api/onboarding/complete/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        approachId: approach.id,
        weakPoints: [],
        availableEquipment: ['barbell'],
        equipmentPreferences: {},
        strengthBaseline: {},
        firstName: 'Test',
        gender: 'male',
        age: 30,
        weight: 80,
        height: 180,
        confirmedExperience: 2,
        splitType: 'push_pull_legs',
        weeklyFrequency: 4,
        generationRequestId: requestId
      })
    })

    console.log('API Response status:', response.status)

    if (!response.ok) {
      const text = await response.text()
      console.error('API Error:', text)
      return
    }

    // Read a few chunks
    const reader = response.body?.getReader()
    if (reader) {
      for (let i = 0; i < 5; i++) {
        const { done, value } = await reader.read()
        if (done) break
        const text = new TextDecoder().decode(value)
        console.log(`Chunk ${i}:`, text.substring(0, 100))
      }
      reader.cancel()
    }

    // Wait and check queue
    await new Promise(r => setTimeout(r, 3000))

    const { data: queueEntry, error: queueError } = await supabaseAdmin
      .from('workout_generation_queue')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (queueError) {
      console.error('Queue entry error:', queueError)
    } else if (!queueEntry) {
      console.error('❌ Queue entry NOT found!')
    } else {
      console.log('✅ Queue entry found:', {
        id: queueEntry.id,
        status: queueEntry.status,
        progress: queueEntry.progress_percent,
        phase: queueEntry.current_phase
      })
    }
  } catch (error) {
    console.error('Test error:', error)
  } finally {
    // Cleanup
    await supabaseAdmin.from('workout_generation_queue').delete().eq('user_id', userId)
    await supabaseAdmin.from('split_plans').delete().eq('user_id', userId)
    await supabaseAdmin.from('user_profiles').delete().eq('user_id', userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    console.log('Cleaned up')
  }
}

testAPIDirectly()
