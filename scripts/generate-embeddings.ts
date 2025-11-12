#!/usr/bin/env tsx
/**
 * Generate Exercise Embeddings Script
 *
 * Pre-generates embeddings for all ExerciseDB exercises and saves them as a static file.
 * This file is then distributed to all users via the Next.js bundle.
 *
 * Usage:
 *   npm run generate:embeddings
 *   or
 *   tsx scripts/generate-embeddings.ts
 *
 * Requirements:
 *   - OPENAI_API_KEY environment variable
 *   - NEXT_PUBLIC_EXERCISEDB_API_URL (optional, defaults to RapidAPI)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

interface ExerciseDBExercise {
  id: string
  name: string
  gifUrl: string
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
  instructions: string[]
}

interface EmbeddingCacheData {
  version: string
  model: string
  embeddings: Record<string, number[]> // exerciseName -> embedding
  timestamp: number
  exerciseCount: number
  metadata: {
    generatedAt: string
    apiModel: string
    dimensions: number
    precision: string
  }
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_VERSION = '1.0.0'
const BATCH_SIZE = 100
const OUTPUT_DIR = join(process.cwd(), 'public', 'data')
const OUTPUT_FILE = join(OUTPUT_DIR, 'exercise-embeddings.json')

async function fetchAllExercises(): Promise<ExerciseDBExercise[]> {
  const apiBase = process.env.NEXT_PUBLIC_EXERCISEDB_API_URL || 'https://exercisedb.p.rapidapi.com'
  const apiKey = process.env.NEXT_PUBLIC_EXERCISEDB_API_KEY

  console.log('📦 Fetching exercises from ExerciseDB...')
  console.log(`   API: ${apiBase}`)

  let allExercises: ExerciseDBExercise[] = []

  // Self-hosted API (pagination)
  if (apiBase.includes('vercel.app')) {
    const pageSize = 100
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const endpoint = `${apiBase}/api/v1/exercises?limit=${pageSize}&offset=${offset}`
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error(`ExerciseDB API error: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      const exercises = responseData.data || []
      allExercises.push(...exercises)

      const totalExercises = responseData.metadata?.totalExercises || 0
      hasMore = allExercises.length < totalExercises

      if (hasMore) {
        offset += pageSize
        console.log(`   Fetched ${allExercises.length}/${totalExercises} exercises...`)
      }
    }
  } else {
    // RapidAPI format
    const endpoint = `${apiBase}/exercises`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (apiKey) {
      headers['X-RapidAPI-Key'] = apiKey
      headers['X-RapidAPI-Host'] = 'exercisedb.p.rapidapi.com'
    }

    const response = await fetch(endpoint, { headers })

    if (!response.ok) {
      throw new Error(`ExerciseDB API error: ${response.status} ${response.statusText}`)
    }

    allExercises = await response.json()
  }

  console.log(`✓ Fetched ${allExercises.length} exercises\n`)
  return allExercises
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(optional\s+)?(finisher|warm-?up|cool-?down|bonus|activation)\s*[—\-]\s*/i, '')
    .replace(/^(flat|standing)\s+/i, '')
    .replace(/\s+-\s+.*$/, '')
    .replace(/\s+paused\s+\d+s?\s+(at|on)\s+\w+/i, '')
    .replace(/\s+\d+-\d+-\d+-\d+/i, '')
    .replace(/—/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment variables')
  }

  const openai = new OpenAI({ apiKey })
  const embeddings: number[][] = []
  const batches = []

  // Split into batches
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE))
  }

  console.log(`🤖 Generating embeddings using ${EMBEDDING_MODEL}...`)
  console.log(`   Batches: ${batches.length} × ${BATCH_SIZE} texts`)
  console.log(`   Estimated cost: ~$${((texts.length * 10) / 1_000_000 * 0.02).toFixed(4)}\n`)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
        encoding_format: 'float',
      })

      const batchEmbeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding)

      embeddings.push(...batchEmbeddings)

      const processed = Math.min((i + 1) * BATCH_SIZE, texts.length)
      const percent = Math.round((processed / texts.length) * 100)
      console.log(`   Progress: ${processed}/${texts.length} (${percent}%)`)

      // Rate limiting: small delay between batches
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    } catch (error) {
      console.error(`   ✗ Error in batch ${i + 1}/${batches.length}:`, error)
      throw error
    }
  }

  console.log(`✓ Generated ${embeddings.length} embeddings\n`)
  return embeddings
}

function saveToFile(data: EmbeddingCacheData): void {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`✓ Created directory: ${OUTPUT_DIR}`)
  }

  // Convert to JSON
  const json = JSON.stringify(data, null, 2)
  const sizeMB = (json.length / (1024 * 1024)).toFixed(2)

  writeFileSync(OUTPUT_FILE, json, 'utf-8')

  console.log(`✓ Saved embeddings to: ${OUTPUT_FILE}`)
  console.log(`   Size: ${sizeMB} MB (uncompressed)`)
  console.log(`   Gzip size: ~${(parseFloat(sizeMB) * 0.3).toFixed(2)} MB (estimated)`)
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Exercise Embeddings Generator')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // Step 1: Fetch exercises
    const exercises = await fetchAllExercises()

    // Step 2: Normalize names
    console.log('📝 Normalizing exercise names...')
    const exerciseMap = new Map<string, ExerciseDBExercise>()
    exercises.forEach((exercise) => {
      const normalizedName = normalizeName(exercise.name)
      exerciseMap.set(normalizedName, exercise)
    })
    const normalizedNames = Array.from(exerciseMap.keys())
    console.log(`✓ Normalized ${normalizedNames.length} unique exercise names\n`)

    // Step 3: Generate embeddings
    const embeddings = await generateEmbeddings(normalizedNames)

    // Step 4: Build output data
    console.log('📦 Building output data...')
    const embeddingMap: Record<string, number[]> = {}
    normalizedNames.forEach((name, index) => {
      embeddingMap[name] = embeddings[index]
    })

    const outputData: EmbeddingCacheData = {
      version: EMBEDDING_VERSION,
      model: EMBEDDING_MODEL,
      embeddings: embeddingMap,
      timestamp: Date.now(),
      exerciseCount: normalizedNames.length,
      metadata: {
        generatedAt: new Date().toISOString(),
        apiModel: EMBEDDING_MODEL,
        dimensions: embeddings[0].length,
        precision: 'float64',
      },
    }
    console.log(`✓ Built output data\n`)

    // Step 5: Save to file
    console.log('💾 Saving to file...')
    saveToFile(outputData)

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✓ Embeddings generated successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('Next steps:')
    console.log('  1. Review the generated file at:', OUTPUT_FILE)
    console.log('  2. Commit to repo OR add to .gitignore')
    console.log('  3. Run: npm run dev')
    console.log('')
  } catch (error) {
    console.error('\n✗ Error generating embeddings:', error)
    process.exit(1)
  }
}

main()
