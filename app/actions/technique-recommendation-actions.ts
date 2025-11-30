'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth.server'
import {
  TechniqueRecommenderAgent,
  type TechniqueRecommendationInput,
  type TechniqueRecommendationOutput,
  type TechniqueValidationInput,
  type TechniqueValidationOutput,
} from '@/lib/agents/technique-recommender.agent'
import type { TechniqueType } from '@/lib/types/advanced-techniques'

/**
 * Get AI-powered technique recommendations for an exercise
 */
export async function getTechniqueRecommendationsAction(
  input: TechniqueRecommendationInput
): Promise<{
  success: boolean
  data?: TechniqueRecommendationOutput
  error?: string
}> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await getSupabaseServerClient()
    const agent = new TechniqueRecommenderAgent(supabase)
    agent.setUserId(user.id)

    const recommendations = await agent.recommend(input)

    return { success: true, data: recommendations }
  } catch (error) {
    console.error('[Action] getTechniqueRecommendationsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get technique recommendations',
    }
  }
}

/**
 * Validate a user's technique choice when they select a non-recommended technique
 */
export async function validateTechniqueChoiceAction(
  input: TechniqueRecommendationInput,
  chosenTechnique: TechniqueType
): Promise<{
  success: boolean
  data?: TechniqueValidationOutput
  error?: string
}> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await getSupabaseServerClient()
    const agent = new TechniqueRecommenderAgent(supabase)
    agent.setUserId(user.id)

    const validationInput: TechniqueValidationInput = {
      ...input,
      chosenTechnique,
    }

    const validation = await agent.validateChoice(validationInput)

    return { success: true, data: validation }
  } catch (error) {
    console.error('[Action] validateTechniqueChoiceAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate technique choice',
    }
  }
}

/**
 * Get AI-powered technique recommendations for multiple exercises in parallel
 * Used when saving workout review to batch all AI calls
 */
export async function getBatchTechniqueRecommendationsAction(
  inputs: Array<{ exerciseIndex: number; input: TechniqueRecommendationInput }>
): Promise<{
  success: boolean
  data?: Array<{
    exerciseIndex: number
    recommendations: TechniqueRecommendationOutput | null
    error?: string
  }>
  error?: string
}> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await getSupabaseServerClient()

    // Execute all recommendations in parallel
    const results = await Promise.all(
      inputs.map(async ({ exerciseIndex, input }) => {
        try {
          const agent = new TechniqueRecommenderAgent(supabase)
          agent.setUserId(user.id)
          const recommendations = await agent.recommend(input)
          return { exerciseIndex, recommendations, error: undefined }
        } catch (error) {
          console.error(`[Action] getBatchTechniqueRecommendationsAction error for exercise ${exerciseIndex}:`, error)
          return {
            exerciseIndex,
            recommendations: null,
            error: error instanceof Error ? error.message : 'Failed to get recommendations',
          }
        }
      })
    )

    return { success: true, data: results }
  } catch (error) {
    console.error('[Action] getBatchTechniqueRecommendationsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get batch technique recommendations',
    }
  }
}

