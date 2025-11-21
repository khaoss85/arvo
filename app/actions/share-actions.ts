'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth.server'
import { generateShareToken } from '@/lib/utils/share-token'
import type {
  CreateShareLinkInput,
  SharePrivacySettings,
} from '@/lib/types/share.types'
import { DEFAULT_PRIVACY_SETTINGS } from '@/lib/types/share.types'

/**
 * Create a new share link
 */
export async function createShareLinkAction(input: CreateShareLinkInput) {
  try {
    const user = await getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const supabase = await getSupabaseServerClient()

    // Check if share link already exists for this entity
    const { data: existing } = await supabase
      .from('share_links')
      .select('share_token, id')
      .eq('user_id', user.id)
      .eq('share_type', input.shareType)
      .eq('entity_id', input.entityId)
      .maybeSingle()

    // If exists and not expired, return existing
    if (existing) {
      return {
        success: true,
        data: {
          token: existing.share_token,
          shareId: existing.id,
          isNew: false
        }
      }
    }

    // Generate unique token (retry if collision, though unlikely)
    let token = generateShareToken()
    let attempts = 0
    while (attempts < 5) {
      const { data: collision } = await supabase
        .from('share_links')
        .select('id')
        .eq('share_token', token)
        .maybeSingle()

      if (!collision) break
      token = generateShareToken()
      attempts++
    }

    if (attempts === 5) {
      return {
        success: false,
        error: 'Failed to generate unique token'
      }
    }

    // Merge privacy settings with defaults
    const privacySettings = {
      ...DEFAULT_PRIVACY_SETTINGS,
      ...input.privacySettings
    }

    // Calculate expiration if specified
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Create share link
    const { data, error } = await supabase
      .from('share_links')
      .insert({
        share_token: token,
        user_id: user.id,
        share_type: input.shareType,
        entity_id: input.entityId,
        privacy_settings: privacySettings,
        expires_at: expiresAt,
      })
      .select('share_token, id')
      .single()

    if (error) throw error

    return {
      success: true,
      data: {
        token: data.share_token,
        shareId: data.id,
        isNew: true
      }
    }
  } catch (error: any) {
    console.error('Error creating share link:', error)
    return {
      success: false,
      error: error?.message || 'Failed to create share link'
    }
  }
}

/**
 * Get user's share links
 */
export async function getUserShareLinksAction() {
  try {
    const user = await getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error('Error fetching share links:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch share links'
    }
  }
}

/**
 * Update share link privacy settings
 */
export async function updateShareLinkAction(
  shareId: string,
  privacySettings: Partial<SharePrivacySettings>
) {
  try {
    const user = await getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const supabase = await getSupabaseServerClient()

    // Verify ownership
    const { data: shareLink } = await supabase
      .from('share_links')
      .select('privacy_settings')
      .eq('id', shareId)
      .eq('user_id', user.id)
      .single()

    if (!shareLink) {
      return {
        success: false,
        error: 'Share link not found'
      }
    }

    // Merge with existing settings
    const updatedSettings = {
      ...(shareLink.privacy_settings as unknown as SharePrivacySettings),
      ...privacySettings
    }

    const { error } = await supabase
      .from('share_links')
      .update({
        privacy_settings: updatedSettings
      })
      .eq('id', shareId)
      .eq('user_id', user.id)

    if (error) throw error

    return {
      success: true,
      data: updatedSettings
    }
  } catch (error: any) {
    console.error('Error updating share link:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update share link'
    }
  }
}

/**
 * Delete a share link
 */
export async function deleteShareLinkAction(shareId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('id', shareId)
      .eq('user_id', user.id)

    if (error) throw error

    return {
      success: true
    }
  } catch (error: any) {
    console.error('Error deleting share link:', error)
    return {
      success: false,
      error: error?.message || 'Failed to delete share link'
    }
  }
}

/**
 * Get public share data by token (NO AUTH REQUIRED - public endpoint)
 * This is called from public landing pages
 */
export async function getPublicShareDataAction(token: string) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get share link (includes privacy settings)
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('share_links')
      .select('*')
      .eq('share_token', token)
      .maybeSingle()

    if (shareLinkError) throw shareLinkError

    if (!shareLink) {
      return {
        success: false,
        error: 'Share link not found'
      }
    }

    // Check expiration
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Share link has expired'
      }
    }

    // Increment view count (fire and forget)
    supabase.rpc('increment_share_view_count', { token }).then()

    // Fetch actual data based on share type
    let entityData: any = null

    switch (shareLink.share_type) {
      case 'cycle':
        const { data: cycle } = await supabase
          .from('cycle_completions')
          .select('*')
          .eq('id', shareLink.entity_id)
          .single()
        entityData = cycle
        break

      case 'progress':
        const { data: progress } = await supabase
          .from('progress_checks')
          .select('*, photos:progress_photos(*), measurements:body_measurements(*)')
          .eq('id', shareLink.entity_id)
          .single()
        entityData = progress
        break

      case 'workout':
        const { data: workout } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', shareLink.entity_id)
          .single()
        entityData = workout
        break
    }

    if (!entityData) {
      return {
        success: false,
        error: 'Content not found'
      }
    }

    // Get user info if privacy allows
    let userInfo = null
    const privacySettings = shareLink.privacy_settings as unknown as SharePrivacySettings

    if (privacySettings.showName) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name')
        .eq('user_id', shareLink.user_id)
        .single()

      if (profile) {
        userInfo = {
          name: privacySettings.showName ? profile.first_name : null,
          photo: null  // Avatar not stored in user_profiles
        }
      }
    }

    return {
      success: true,
      data: {
        shareType: shareLink.share_type,
        createdAt: shareLink.created_at,
        viewCount: shareLink.view_count,
        privacySettings,
        entityData,
        userInfo
      }
    }
  } catch (error: any) {
    console.error('Error fetching public share data:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch share data'
    }
  }
}

/**
 * Get share analytics for current user
 */
export async function getShareAnalyticsAction() {
  try {
    const user = await getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    const supabase = await getSupabaseServerClient()

    const { data: shares, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!shares || shares.length === 0) {
      return {
        success: true,
        data: {
          totalShares: 0,
          totalViews: 0,
          averageViewsPerShare: 0,
          recentShares: []
        }
      }
    }

    const totalShares = shares.length
    const totalViews = shares.reduce((sum: number, s: any) => sum + s.view_count, 0)
    const averageViewsPerShare = totalViews / totalShares

    // Get type distribution
    const typeCount = shares.reduce((acc: Record<string, number>, s: any) => {
      acc[s.share_type] = (acc[s.share_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topSharedType = Object.entries(typeCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] as 'cycle' | 'progress' | 'workout' | undefined

    return {
      success: true,
      data: {
        totalShares,
        totalViews,
        averageViewsPerShare: Math.round(averageViewsPerShare * 10) / 10,
        topSharedType,
        recentShares: shares.slice(0, 5).map((s: any) => ({
          token: s.share_token,
          type: s.share_type,
          views: s.view_count,
          createdAt: s.created_at
        }))
      }
    }
  } catch (error: any) {
    console.error('Error fetching share analytics:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch analytics'
    }
  }
}
