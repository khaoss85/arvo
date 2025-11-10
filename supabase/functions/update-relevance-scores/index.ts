// Supabase Edge Function: Update Relevance Scores (Time-Decay)
// Scheduled to run daily at midnight

import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('[TimeDecay] Starting relevance score update...')

    // Call the database function that handles time-decay
    const { error } = await supabase.rpc('update_insight_relevance_scores')

    if (error) {
      console.error('[TimeDecay] Error updating relevance scores:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('[TimeDecay] Relevance scores updated successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Time-decay applied successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[TimeDecay] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
