import { Inngest } from 'inngest'

/**
 * Inngest client for ARVO Workout Generator
 *
 * Handles asynchronous workout generation with:
 * - Progress tracking
 * - Auto-retry on failures
 * - Long-running operations (up to 1 hour)
 */
export const inngest = new Inngest({
  id: 'arvo',
  name: 'ARVO Workout Generator',
  // Event key will be loaded from environment in production
  eventKey: process.env.INNGEST_EVENT_KEY,
})
