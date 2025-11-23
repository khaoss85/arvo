import { config } from 'dotenv'

config({ path: '.env.local' })

const AUTH_TOKEN = process.argv[2]

if (!AUTH_TOKEN) {
  console.error('Usage: tsx scripts/test-full-stream.ts <token>')
  process.exit(1)
}

const userId = '8876430f-4f07-4fda-989c-c6448544473d'
const requestId = crypto.randomUUID()

console.log('Request ID:', requestId)
console.log('User ID:', userId)
console.log('\n--- Calling API ---\n')

fetch('http://localhost:3000/api/onboarding/complete/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  },
  body: JSON.stringify({
    userId,
    approachId: 'cbb3537b-b5e9-4287-aa56-e95c74de99e8',
    weakPoints: [],
    availableEquipment: ['barbell', 'dumbbell'],
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
.then(async response => {
  console.log('Status:', response.status)
  console.log('Headers:', Object.fromEntries(response.headers.entries()))
  console.log('\n--- Stream Data ---\n')

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (reader) {
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      buffer += text
      console.log(text)
    }
  }

  console.log('\n--- Stream Ended ---')
})
.catch(error => {
  console.error('Error:', error)
})
