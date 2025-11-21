/**
 * Share Link Types
 * For Strava-style public sharing of fitness results
 *
 * Note: Using manual type definitions until share_links table is added to database.types.ts
 */

export type ShareType = 'cycle' | 'progress' | 'workout'

export interface ShareLink {
  id: string
  share_token: string
  user_id: string
  share_type: ShareType
  entity_id: string
  privacy_settings: SharePrivacySettings
  view_count: number
  created_at: string
  expires_at: string | null
  updated_at: string
}

export interface ShareLinkInsert {
  id?: string
  share_token: string
  user_id: string
  share_type: ShareType
  entity_id: string
  privacy_settings?: SharePrivacySettings
  view_count?: number
  created_at?: string
  expires_at?: string | null
  updated_at?: string
}

export interface ShareLinkUpdate {
  share_token?: string
  share_type?: ShareType
  entity_id?: string
  privacy_settings?: SharePrivacySettings
  view_count?: number
  expires_at?: string | null
  updated_at?: string
}

/**
 * Privacy settings for what to show/hide in public shares
 */
export interface SharePrivacySettings {
  showName: boolean         // Show user's real name vs "Someone"
  showPhoto: boolean        // Show profile photo
  showStats: boolean        // Show numerical stats
  showCharts: boolean       // Show graphs/visualizations
  showExercises: boolean    // Show exercise names
  showNotes: boolean        // Show workout/cycle notes
}

/**
 * Default privacy settings (privacy-first approach)
 */
export const DEFAULT_PRIVACY_SETTINGS: SharePrivacySettings = {
  showName: false,
  showPhoto: false,
  showStats: true,
  showCharts: true,
  showExercises: true,
  showNotes: false,
}

/**
 * Input for creating a share link
 */
export interface CreateShareLinkInput {
  shareType: ShareType
  entityId: string
  privacySettings?: Partial<SharePrivacySettings>
  expiresInDays?: number  // Optional expiration (e.g., 30 days)
}

/**
 * Data returned when fetching a share link for public view
 */
export interface PublicShareData {
  shareType: ShareType
  createdAt: string
  viewCount: number
  privacySettings: SharePrivacySettings
  data: CycleShareData | ProgressShareData | WorkoutShareData
}

/**
 * Cycle completion share data
 */
export interface CycleShareData {
  cycleNumber: number
  completedAt: string
  totalVolume: number
  totalWorkouts: number
  totalSets: number
  totalDurationSeconds: number
  volumeByMuscleGroup: Record<string, number> // Legacy field - actually contains sets count
  setsByMuscleGroup?: Record<string, number> // Semantically correct name for sets data (used by radar chart)
  splitType?: string
  targetVolumeDistribution?: Record<string, number>
  // User info (conditional on privacy settings)
  userName?: string
  userPhoto?: string
  notes?: string
}

/**
 * Progress check share data
 */
export interface ProgressShareData {
  checkDate: string
  weight?: number
  notes?: string
  // Photos (conditional on privacy settings)
  photos?: {
    front?: string
    side_left?: string
    side_right?: string
    back?: string
  }
  // Measurements (conditional on privacy settings)
  measurements?: Array<{
    type: string
    value: number
  }>
  // Comparison with previous check if available
  previousCheck?: {
    date: string
    weightDelta?: number
    measurementDeltas?: Record<string, number>
  }
  // User info (conditional on privacy settings)
  userName?: string
  userPhoto?: string
}

/**
 * Workout share data
 */
export interface WorkoutShareData {
  workoutDate: string
  splitName?: string
  totalVolume: number
  totalSets: number
  durationSeconds: number
  exercises?: Array<{
    name: string
    sets: number
    reps?: number
    weight?: number
    volume?: number
  }>
  volumeByMuscleGroup?: Record<string, number>
  notes?: string
  // User info (conditional on privacy settings)
  userName?: string
  userPhoto?: string
}

/**
 * Analytics data for share links
 */
export interface ShareAnalytics {
  totalShares: number
  totalViews: number
  averageViewsPerShare: number
  clickThroughRate: number  // % of viewers who clicked download/signup
  conversionRate: number     // % who actually signed up
  topSharedType: ShareType
  recentShares: Array<{
    token: string
    type: ShareType
    views: number
    createdAt: string
  }>
}
