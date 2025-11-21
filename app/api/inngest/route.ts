import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { generateWorkoutFunction } from '@/lib/inngest/functions/generate-workout'
import { generateSplitFunction } from '@/lib/inngest/functions/generate-split'
import { adaptSplitFunction } from '@/lib/inngest/functions/adapt-split'

/**
 * Inngest webhook endpoint
 *
 * This endpoint receives events from Inngest and triggers
 * the registered functions.
 *
 * Endpoint: /api/inngest
 * Methods: GET, POST, PUT
 *
 * In development: Inngest Dev Server handles this
 * In production: Inngest Cloud sends events here
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateWorkoutFunction,
    generateSplitFunction,
    adaptSplitFunction,
  ],
  // Signing key for production (verifies requests come from Inngest)
  signingKey: process.env.INNGEST_SIGNING_KEY,
})
