import { z } from "zod";

// Training Approach Category
export const approachCategorySchema = z.enum(['bodybuilding', 'powerlifting']);
export type ApproachCategory = z.infer<typeof approachCategorySchema>;

// Sport Goal for approach recommendations
export const sportGoalSchema = z.enum([
  'none',           // Default - no specific sport goal
  'running',        // Running/Marathon
  'swimming',       // Swimming
  'cycling',        // Cycling
  'soccer',         // Soccer/Football
  'skiing',         // Pre-ski conditioning
  'hyrox',          // Hyrox competition
  'triathlon',      // Triathlon
  'climbing',       // Rock climbing
  'martial_arts',   // Martial arts
  'tennis',         // Tennis/Padel/Racquet sports
  'basketball',     // Basketball/Volleyball
  'rowing',         // Rowing/Canoeing
  'other'           // Other (with notes)
]);
export type SportGoal = z.infer<typeof sportGoalSchema>;

// Body Type (Morphotype) for training personalization
export const bodyTypeSchema = z.enum([
  'gynoid',      // Female: pear-shaped, fat storage in hips/thighs
  'android',    // Female: apple-shaped, fat storage in abdomen
  'mixed',      // Female: balanced distribution
  'ectomorph',  // Male: lean, difficulty gaining mass
  'mesomorph',  // Male: naturally muscular, gains easily
  'endomorph'   // Male: stores fat easily, wider build
]);
export type BodyType = z.infer<typeof bodyTypeSchema>;

// Training Approaches Schema
export const trainingApproachSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  creator: z.string().nullable(),
  category: approachCategorySchema.default('bodybuilding'),
  philosophy: z.string().nullable(),
  short_philosophy: z.string().nullable(),
  variables: z.record(z.string(), z.unknown()),
  progression_rules: z.record(z.string(), z.unknown()),
  exercise_rules: z.record(z.string(), z.unknown()),
  rationales: z.record(z.string(), z.unknown()).nullable(),
});

export const insertTrainingApproachSchema = trainingApproachSchema.omit({ id: true }).extend({
  id: z.string().uuid().optional(),
});

export const updateTrainingApproachSchema = insertTrainingApproachSchema.partial();

// Users Schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  created_at: z.string().datetime().nullable(),
});

export const insertUserSchema = userSchema.omit({ id: true }).extend({
  id: z.string().uuid().optional(),
});

export const updateUserSchema = insertUserSchema.partial();

// User Profiles Schema
export const userProfileSchema = z.object({
  user_id: z.string().uuid(),
  approach_id: z.string().uuid().nullable(),
  weak_points: z.array(z.string()).nullable(),
  experience_years: z.number().int().min(0).nullable(),
  strength_baseline: z.record(z.string(), z.unknown()).nullable(),
  available_equipment: z.array(z.string()).nullable().optional(),
  custom_equipment: z.array(z.any()).nullable().optional(), // Custom equipment added by user
  preferred_split: z.string().nullable(),
  preferred_specialization_muscle: z.string().nullable().optional(), // Preferred muscle for weak_point_focus splits
  // Split planning fields
  active_split_plan_id: z.string().uuid().nullable(),
  current_cycle_day: z.number().int().min(1).nullable(),
  // Cycle completion tracking fields
  cycles_completed: z.number().int().min(0).nullable(),
  current_cycle_start_date: z.string().datetime().nullable(),
  last_cycle_completed_at: z.string().datetime().nullable(),
  // Mesocycle tracking fields
  current_mesocycle_week: z.number().int().min(1).max(12).nullable(),
  mesocycle_phase: z.enum(['accumulation', 'intensification', 'deload', 'transition']).nullable(),
  mesocycle_start_date: z.string().datetime().nullable(),
  // Caloric phase tracking fields
  caloric_phase: z.enum(['bulk', 'cut', 'maintenance']).nullable(),
  caloric_phase_start_date: z.string().datetime().nullable(),
  caloric_intake_kcal: z.number().int().min(-1500).max(1500).nullable(),
  // Demographic fields for personalized AI training
  first_name: z.string().max(50).nullable(),
  gender: z.enum(['male', 'female', 'other']).nullable(),
  training_focus: z.enum(['upper_body', 'lower_body', 'balanced']).nullable(),
  // Body type (morphotype) for personalized training
  body_type: bodyTypeSchema.nullable().optional(),
  age: z.number().int().min(13).max(120).nullable(),
  weight: z.number().min(0).max(500).nullable(), // kg
  height: z.number().min(0).max(300).nullable(), // cm
  // Language preference for UI and AI-generated content
  preferred_language: z.enum(['en', 'it']).default('en'),
  // Audio coaching preferences
  audio_coaching_enabled: z.boolean().default(true),
  audio_coaching_autoplay: z.boolean().default(false),
  audio_coaching_speed: z.number().min(0.5).max(2.0).default(1.0),
  // App mode preference (simple for basic users, advanced for power users)
  app_mode: z.enum(['simple', 'advanced']).optional().default('advanced'),
  // Sport-specific goal for approach recommendations
  sport_goal: sportGoalSchema.nullable().optional().default('none'),
  // Coach relationship (if user is assigned to a coach)
  coach_id: z.string().uuid().nullable().optional(),
});

export const insertUserProfileSchema = userProfileSchema;

export const updateUserProfileSchema = userProfileSchema.partial().required({ user_id: true });

// Split Plan Archived Reason
export const splitPlanArchivedReasonSchema = z.enum(['coach_replaced', 'user_changed']);
export type SplitPlanArchivedReason = z.infer<typeof splitPlanArchivedReasonSchema>;

// Split Plan Source
export const splitPlanSourceSchema = z.enum(['self', 'coach']);
export type SplitPlanSource = z.infer<typeof splitPlanSourceSchema>;

// Split Plans Schema
export const splitPlanSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  approach_id: z.string().uuid().nullable(),
  split_type: z.enum(['push_pull_legs', 'upper_lower', 'full_body', 'custom', 'bro_split', 'weak_point_focus', 'arnold_split', 'push_pull', 'hybrid']),
  cycle_days: z.number().int().min(1), // e.g., 8 for Kuba's 3 on 1 off cycle
  sessions: z.array(z.record(z.string(), z.unknown())), // Array of SessionDefinition objects
  frequency_map: z.record(z.string(), z.number()), // muscle group -> frequency per week
  volume_distribution: z.record(z.string(), z.number()), // muscle group -> total sets in cycle
  specialization_muscle: z.string().nullable().optional(), // Target muscle for weak_point_focus split
  specialization_frequency: z.number().int().min(1).nullable().optional(), // Times per cycle
  specialization_volume_multiplier: z.number().min(1.0).max(3.0).nullable().optional(), // Volume multiplier (e.g., 1.5 = 50% more)
  ai_response_id: z.string().nullable().optional(), // OpenAI response ID for GPT-5 reasoning persistence
  active: z.boolean().nullable(),
  // Archival fields for coach overlay functionality
  archived_at: z.string().datetime().nullable().optional(), // When split was archived
  archived_reason: splitPlanArchivedReasonSchema.nullable().optional(), // Why it was archived
  source: splitPlanSourceSchema.default('self').optional(), // Who created this split: self or coach
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertSplitPlanSchema = splitPlanSchema.omit({ id: true, created_at: true, updated_at: true }).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateSplitPlanSchema = insertSplitPlanSchema.partial();

// Exercise Generations Schema (AI-generated exercises)
export const exerciseGenerationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Exercise name is required"),
  generated_by_ai: z.boolean().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(), // primaryMuscles, secondaryMuscles, movementPattern, romEmphasis, unilateral, equipmentUsed
  user_id: z.string().uuid().nullable(), // NULL for global exercises
  usage_count: z.number().int().min(0).nullable(),
  last_used_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().nullable(),
});

export const insertExerciseGenerationSchema = exerciseGenerationSchema.omit({ id: true, created_at: true, last_used_at: true }).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  last_used_at: z.string().datetime().optional(),
});

export const updateExerciseGenerationSchema = insertExerciseGenerationSchema.partial();

// Caloric Phase History Schema
export const caloricPhaseHistorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  phase: z.enum(['bulk', 'cut', 'maintenance']),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable(),
  is_active: z.boolean(),
  duration_weeks: z.number().nullable(), // Computed field
  avg_weight_change: z.number().nullable(), // kg gained/lost
  caloric_intake_kcal: z.number().int().min(-1500).max(1500).nullable(), // Daily caloric surplus/deficit
  notes: z.string().nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertCaloricPhaseHistorySchema = caloricPhaseHistorySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  duration_weeks: true, // Computed field
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateCaloricPhaseHistorySchema = insertCaloricPhaseHistorySchema.partial();

// Cycle Completions Schema
export const cycleCompletionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  split_plan_id: z.string().uuid(),
  cycle_number: z.number().int().min(1),
  completed_at: z.string().datetime(),
  total_volume: z.number().min(0),
  total_workouts_completed: z.number().int().min(0),
  avg_mental_readiness: z.number().min(1).max(5).nullable(),
  total_sets: z.number().int().min(0),
  total_duration_seconds: z.number().int().min(0).nullable(),
  volume_by_muscle_group: z.record(z.string(), z.number()).nullable(),
  sets_by_muscle_group: z.record(z.string(), z.number()).nullable(),
  workouts_by_type: z.record(z.string(), z.number()).nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertCycleCompletionSchema = cycleCompletionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateCycleCompletionSchema = insertCycleCompletionSchema.partial();

// DEPRECATED: Old exercises table (dropped in migration)
// Kept for backwards compatibility with existing code
export const exerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Exercise name is required"),
  pattern: z.string().nullable(),
  equipment_variants: z.record(z.string(), z.unknown()).nullable(),
});

export const insertExerciseSchema = exerciseSchema.omit({ id: true }).extend({
  id: z.string().uuid().optional(),
});

export const updateExerciseSchema = insertExerciseSchema.partial();

// Workout Status Enum
export const workoutStatusSchema = z.enum(['draft', 'ready', 'in_progress', 'completed']);
export type WorkoutStatus = z.infer<typeof workoutStatusSchema>;

// Workouts Schema
export const workoutSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  approach_id: z.string().uuid().nullable(),
  planned_at: z.string().date().nullable(),
  exercises: z.array(z.record(z.string(), z.unknown())).nullable(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  duration_seconds: z.number().int().min(0).nullable(),
  total_volume: z.number().min(0).nullable(),
  total_sets: z.number().int().min(0).nullable(),
  notes: z.string().nullable(),
  workout_type: z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'chest', 'back', 'shoulders', 'arms', 'rest', 'chest_back', 'shoulders_arms', 'custom']).nullable(),
  workout_name: z.string().nullable(),
  target_muscle_groups: z.array(z.string()).nullable(),
  split_type: z.string().nullable(),
  mental_readiness_overall: z.number().int().min(1).max(5).nullable(),
  // Split planning fields
  split_plan_id: z.string().uuid().nullable(),
  cycle_day: z.number().int().min(1).nullable(), // Which day of the cycle (1 to cycle_days)
  variation: z.enum(['A', 'B', 'none']).nullable(), // A/B variation (or 'none' for REST days)
  // Workout status field
  status: workoutStatusSchema.nullable(),
  // Audio coaching scripts
  audio_scripts: z.record(z.string(), z.unknown()).nullable().optional(),
  // GPT-5 reasoning persistence for exercise selection
  ai_response_id: z.string().nullable().optional(),
  // Timestamps
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
  // Coach assignment fields
  assigned_by_coach_id: z.string().uuid().nullable().optional(),
  coach_locked: z.boolean().nullable().optional(),
  // AI suggestions toggle (can be disabled by coach)
  ai_suggestions_enabled: z.boolean().default(true).nullable().optional(),
});

export const insertWorkoutSchema = workoutSchema.omit({ id: true }).extend({
  id: z.string().uuid().optional(),
});

export const updateWorkoutSchema = insertWorkoutSchema.partial();

// Sets Log Schema
export const setLogSchema = z.object({
  id: z.string().uuid(),
  workout_id: z.string().uuid().nullable(),
  exercise_id: z.string().uuid().nullable(),
  exercise_name: z.string().min(1, "Exercise name is required"),
  set_number: z.number().int().min(1).nullable(),
  weight_target: z.number().min(0).nullable(),
  weight_actual: z.number().min(0).nullable(),
  reps_target: z.number().int().min(1).nullable(),
  reps_actual: z.number().int().min(0).nullable(),
  rir_actual: z.number().int().min(0).max(10).nullable(),
  mental_readiness: z.number().int().min(1).max(5).nullable(),
  notes: z.string().nullable(),
  set_type: z.enum(["warmup", "working"]).nullable(),
  skipped: z.boolean().default(false),
  skip_reason: z.string().nullable(),
  // Exercise substitution tracking
  original_exercise_name: z.string().nullable(),
  substitution_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});

export const insertSetLogSchema = setLogSchema.omit({ id: true, created_at: true }).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().optional(),
});

export const updateSetLogSchema = insertSetLogSchema.partial();

// Type exports
export type TrainingApproach = z.infer<typeof trainingApproachSchema>;
export type InsertTrainingApproach = z.infer<typeof insertTrainingApproachSchema>;
export type UpdateTrainingApproach = z.infer<typeof updateTrainingApproachSchema>;

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type UserProfile = z.infer<typeof userProfileSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type Exercise = z.infer<typeof exerciseSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type UpdateExercise = z.infer<typeof updateExerciseSchema>;

export type Workout = z.infer<typeof workoutSchema>;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type UpdateWorkout = z.infer<typeof updateWorkoutSchema>;

export type SetLog = z.infer<typeof setLogSchema>;
export type InsertSetLog = z.infer<typeof insertSetLogSchema>;
export type UpdateSetLog = z.infer<typeof updateSetLogSchema>;

export type SplitPlan = z.infer<typeof splitPlanSchema>;
export type InsertSplitPlan = z.infer<typeof insertSplitPlanSchema>;
export type UpdateSplitPlan = z.infer<typeof updateSplitPlanSchema>;

export type ExerciseGeneration = z.infer<typeof exerciseGenerationSchema>;
export type InsertExerciseGeneration = z.infer<typeof insertExerciseGenerationSchema>;
export type UpdateExerciseGeneration = z.infer<typeof updateExerciseGenerationSchema>;

export type CaloricPhaseHistory = z.infer<typeof caloricPhaseHistorySchema>;
export type InsertCaloricPhaseHistory = z.infer<typeof insertCaloricPhaseHistorySchema>;
export type UpdateCaloricPhaseHistory = z.infer<typeof updateCaloricPhaseHistorySchema>;

export type CycleCompletion = z.infer<typeof cycleCompletionSchema>;
export type InsertCycleCompletion = z.infer<typeof insertCycleCompletionSchema>;
export type UpdateCycleCompletion = z.infer<typeof updateCycleCompletionSchema>;

// =====================================================
// Coach Mode Schemas
// =====================================================

// Coach Profile Schema
export const coachProfileSchema = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().min(1, "Display name is required"),
  bio: z.string().nullable(),
  invite_code: z.string().min(6, "Invite code is required"),
  max_clients: z.number().int().min(1).max(100).default(30),
  subscription_status: z.enum(['trial', 'active', 'inactive']).default('trial'),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertCoachProfileSchema = coachProfileSchema.omit({ created_at: true, updated_at: true }).extend({
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateCoachProfileSchema = insertCoachProfileSchema.partial().required({ user_id: true });

// Client Autonomy Level
export const clientAutonomySchema = z.enum(['minimal', 'standard', 'full']);
export type ClientAutonomy = z.infer<typeof clientAutonomySchema>;

// Relationship Status
export const relationshipStatusSchema = z.enum(['pending', 'active', 'paused', 'terminated']);
export type RelationshipStatus = z.infer<typeof relationshipStatusSchema>;

// Coach-Client Relationship Schema
export const coachClientRelationshipSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  client_id: z.string().uuid(),
  status: relationshipStatusSchema.default('pending'),
  client_autonomy: clientAutonomySchema.default('standard'),
  notes: z.string().nullable(),
  invited_at: z.string().datetime().nullable(),
  accepted_at: z.string().datetime().nullable(),
  terminated_at: z.string().datetime().nullable(),
  termination_reason: z.string().nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertCoachClientRelationshipSchema = coachClientRelationshipSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateCoachClientRelationshipSchema = insertCoachClientRelationshipSchema.partial();

// Coach Client Notes Schema
export const coachClientNoteSchema = z.object({
  id: z.string().uuid(),
  relationship_id: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  is_shared: z.boolean().default(false),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export type CoachClientNote = z.infer<typeof coachClientNoteSchema>;

// Workout Template Schema
export const workoutTemplateSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  name: z.string().min(1, "Template name is required"),
  description: z.string().nullable(),
  workout_type: z.array(z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'chest', 'back', 'shoulders', 'arms', 'rest', 'chest_back', 'shoulders_arms', 'custom'])).nullable(),
  exercises: z.array(z.record(z.string(), z.unknown())),
  target_muscle_groups: z.array(z.string()).nullable(),
  tags: z.array(z.string()).nullable(),
  is_public: z.boolean().default(false),
  usage_count: z.number().int().min(0).default(0),
  ai_suggestions_enabled: z.boolean().default(true),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertWorkoutTemplateSchema = workoutTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  usage_count: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  usage_count: z.number().int().min(0).optional(),
});

export const updateWorkoutTemplateSchema = insertWorkoutTemplateSchema.partial();

// Assignment Type
export const assignmentTypeSchema = z.enum(['ai_generated', 'template', 'custom']);
export type AssignmentType = z.infer<typeof assignmentTypeSchema>;

// Coach Workout Assignment Schema
export const coachWorkoutAssignmentSchema = z.object({
  id: z.string().uuid(),
  workout_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  client_id: z.string().uuid(),
  assignment_type: assignmentTypeSchema.default('custom'),
  template_id: z.string().uuid().nullable(),
  coach_notes: z.string().nullable(),
  client_notes: z.string().nullable(),
  assigned_at: z.string().datetime().nullable(),
  approved_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().nullable(),
});

export const insertCoachWorkoutAssignmentSchema = coachWorkoutAssignmentSchema.omit({
  id: true,
  created_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
});

export const updateCoachWorkoutAssignmentSchema = insertCoachWorkoutAssignmentSchema.partial();

// Coach Mode Type Exports
export type CoachProfile = z.infer<typeof coachProfileSchema>;
export type InsertCoachProfile = z.infer<typeof insertCoachProfileSchema>;
export type UpdateCoachProfile = z.infer<typeof updateCoachProfileSchema>;

export type CoachClientRelationship = z.infer<typeof coachClientRelationshipSchema>;
export type InsertCoachClientRelationship = z.infer<typeof insertCoachClientRelationshipSchema>;
export type UpdateCoachClientRelationship = z.infer<typeof updateCoachClientRelationshipSchema>;

export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;
export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;
export type UpdateWorkoutTemplate = z.infer<typeof updateWorkoutTemplateSchema>;

export type CoachWorkoutAssignment = z.infer<typeof coachWorkoutAssignmentSchema>;
export type InsertCoachWorkoutAssignment = z.infer<typeof insertCoachWorkoutAssignmentSchema>;
export type UpdateCoachWorkoutAssignment = z.infer<typeof updateCoachWorkoutAssignmentSchema>;

// =====================================================
// Coach Split Plan Templates & Assignments
// =====================================================

// Split Type (shared with split_plans)
export const splitTypeSchema = z.enum(['push_pull_legs', 'upper_lower', 'full_body', 'custom', 'bro_split', 'weak_point_focus']);
export type SplitType = z.infer<typeof splitTypeSchema>;

// Session Definition Schema (for sessions JSONB array)
export const sessionDefinitionSchema = z.object({
  day: z.number().int().min(1),
  name: z.string(),
  workoutType: z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'chest', 'back', 'shoulders', 'arms', 'rest']),
  variation: z.enum(['A', 'B', 'none']).nullable().optional(),
  focus: z.array(z.string()), // muscle groups
  targetVolume: z.record(z.string(), z.number()).nullable().optional(), // muscle group -> sets
  principles: z.array(z.string()).nullable().optional(),
});

export type SessionDefinition = z.infer<typeof sessionDefinitionSchema>;

// Split Plan Template Schema
export const splitPlanTemplateSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid().nullable(), // NULL for system templates
  name: z.string().min(1, "Template name is required"),
  description: z.string().nullable(),
  split_type: splitTypeSchema,
  cycle_days: z.number().int().min(1).max(14),
  sessions: z.array(sessionDefinitionSchema),
  frequency_map: z.record(z.string(), z.number()).nullable(), // muscle group -> frequency per week
  volume_distribution: z.record(z.string(), z.number()).nullable(), // muscle group -> total sets in cycle
  tags: z.array(z.string()).nullable(),
  is_public: z.boolean().default(false),
  is_system: z.boolean().default(false), // true for base templates, false for coach-created
  usage_count: z.number().int().min(0).default(0),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertSplitPlanTemplateSchema = splitPlanTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  usage_count: true,
  is_system: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  usage_count: z.number().int().min(0).optional(),
  is_system: z.boolean().optional().default(false),
});

export const updateSplitPlanTemplateSchema = insertSplitPlanTemplateSchema.partial();

// Coach Split Plan Assignment Schema
export const coachSplitPlanAssignmentSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  client_id: z.string().uuid(),
  split_plan_id: z.string().uuid(),
  template_id: z.string().uuid().nullable(),
  assignment_type: assignmentTypeSchema,
  coach_notes: z.string().nullable(),
  assigned_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().nullable(),
});

export const insertCoachSplitPlanAssignmentSchema = coachSplitPlanAssignmentSchema.omit({
  id: true,
  created_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
});

export const updateCoachSplitPlanAssignmentSchema = insertCoachSplitPlanAssignmentSchema.partial();

// Split Plan Template Type Exports
export type SplitPlanTemplate = z.infer<typeof splitPlanTemplateSchema>;
export type InsertSplitPlanTemplate = z.infer<typeof insertSplitPlanTemplateSchema>;
export type UpdateSplitPlanTemplate = z.infer<typeof updateSplitPlanTemplateSchema>;

export type CoachSplitPlanAssignment = z.infer<typeof coachSplitPlanAssignmentSchema>;
export type InsertCoachSplitPlanAssignment = z.infer<typeof insertCoachSplitPlanAssignmentSchema>;
export type UpdateCoachSplitPlanAssignment = z.infer<typeof updateCoachSplitPlanAssignmentSchema>;

// =====================================================
// Booking System Schemas
// =====================================================

// Booking Status
export const bookingStatusSchema = z.enum(['confirmed', 'cancelled', 'completed', 'no_show']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

// Booking Package Status
export const bookingPackageStatusSchema = z.enum(['active', 'completed', 'expired', 'cancelled']);
export type BookingPackageStatus = z.infer<typeof bookingPackageStatusSchema>;

// Notification Type
export const bookingNotificationTypeSchema = z.enum([
  'booking_confirmed',
  'booking_cancelled',
  'booking_rescheduled',
  'reminder_24h',
  'reminder_1h',
  'package_low',
  'package_expired',
  // Cancellation & Waitlist notification types
  'no_show_alert',
  'waitlist_slot_available',
  'waitlist_offer_expired',
  'late_cancellation',
  // Package management notification types
  'package_expiring_soon',
  'package_upgrade_suggestion'
]);
export type BookingNotificationType = z.infer<typeof bookingNotificationTypeSchema>;

// Notification Channel
export const notificationChannelSchema = z.enum(['in_app', 'email']);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

// Notification Status
export const notificationStatusSchema = z.enum(['pending', 'sent', 'failed']);
export type NotificationStatus = z.infer<typeof notificationStatusSchema>;

// Recurring Pattern Frequency
export const recurringFrequencySchema = z.enum(['weekly', 'biweekly']);
export type RecurringFrequency = z.infer<typeof recurringFrequencySchema>;

// Recurring Pattern End Type
export const recurringEndTypeSchema = z.enum(['count', 'date']);
export type RecurringEndType = z.infer<typeof recurringEndTypeSchema>;

// Recurring Pattern Source Type
export const recurringSourceTypeSchema = z.enum(['manual', 'ai_package']);
export type RecurringSourceType = z.infer<typeof recurringSourceTypeSchema>;

// Recurring Pattern Schema
export const recurringPatternSchema = z.object({
  frequency: recurringFrequencySchema,
  endType: recurringEndTypeSchema,
  endValue: z.union([z.number().int().min(1).max(52), z.string()]), // count or "YYYY-MM-DD"
  sourceType: recurringSourceTypeSchema,
  packageId: z.string().uuid().optional(),
  dayOfWeek: z.array(z.number().int().min(0).max(6)), // 0=Sun, 1=Mon, etc.
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/), // "HH:MM"
  createdAt: z.string().datetime().optional()
});
export type RecurringPattern = z.infer<typeof recurringPatternSchema>;

// AI Slot Suggestion Schema (for package-based recurring)
export const aiSlotSuggestionSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  dayName: z.string().optional(),
  time: z.string(),
  confidence: z.number().min(0).max(100),
  reason: z.string().optional()
});
export type AISlotSuggestion = z.infer<typeof aiSlotSuggestionSchema>;

// =====================================================
// SMART CALENDAR TYPES
// =====================================================

// Session Location Type (Multi-location)
export const sessionLocationTypeSchema = z.enum(['in_person', 'online']);
export type SessionLocationType = z.infer<typeof sessionLocationTypeSchema>;

// Coach Block Type
export const coachBlockTypeSchema = z.enum([
  'competition', 'travel', 'study', 'personal', 'custom'
]);
export type CoachBlockType = z.infer<typeof coachBlockTypeSchema>;

// Optimization Suggestion Type
export const optimizationSuggestionTypeSchema = z.enum([
  'consolidate_gap', 'create_block', 'optimize_day'
]);
export type OptimizationSuggestionType = z.infer<typeof optimizationSuggestionTypeSchema>;

// Optimization Suggestion Status
export const optimizationSuggestionStatusSchema = z.enum([
  'pending', 'accepted', 'rejected', 'applied', 'expired'
]);
export type OptimizationSuggestionStatus = z.infer<typeof optimizationSuggestionStatusSchema>;

// Coach Availability Schema
export const coachAvailabilitySchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  date: z.string(), // DATE format YYYY-MM-DD
  start_time: z.string(), // TIME format HH:MM:SS
  end_time: z.string(), // TIME format HH:MM:SS
  is_available: z.boolean().default(true),
  location_type: sessionLocationTypeSchema.default('in_person'),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertCoachAvailabilitySchema = coachAvailabilitySchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateCoachAvailabilitySchema = insertCoachAvailabilitySchema.partial();

// Booking Package Schema
export const bookingPackageSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  client_id: z.string().uuid(),
  name: z.string().min(1, "Package name is required"),
  total_sessions: z.number().int().min(1),
  sessions_per_week: z.number().int().min(1).default(1),
  sessions_used: z.number().int().min(0).default(0),
  start_date: z.string(), // DATE format
  end_date: z.string().nullable(),
  status: bookingPackageStatusSchema.default('active'),
  // AI recurring suggestions
  ai_suggested_slots: z.array(aiSlotSuggestionSchema).nullable(),
  slots_confirmed: z.boolean().default(false),
  // Shared package fields
  is_shared: z.boolean().default(false),
  shared_with_client_ids: z.array(z.string().uuid()).default([]),
  max_shared_users: z.number().int().min(1).max(10).default(1),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertBookingPackageSchema = bookingPackageSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  sessions_used: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  sessions_used: z.number().int().min(0).optional(),
});

export const updateBookingPackageSchema = insertBookingPackageSchema.partial();

// Booking Schema
export const bookingSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  client_id: z.string().uuid(),
  scheduled_date: z.string(), // DATE format YYYY-MM-DD
  start_time: z.string(), // TIME format HH:MM:SS
  end_time: z.string(), // TIME format HH:MM:SS
  duration_minutes: z.number().int().min(15).default(60),
  status: bookingStatusSchema.default('confirmed'),
  package_id: z.string().uuid().nullable(),
  ai_scheduled: z.boolean().default(false),
  ai_suggestion_accepted: z.boolean().nullable(),
  // Location for multi-location support
  location_type: sessionLocationTypeSchema.default('in_person'),
  meeting_url: z.string().url().nullable(),
  // Recurring booking fields
  recurring_series_id: z.string().uuid().nullable(),
  recurring_pattern: recurringPatternSchema.nullable(),
  occurrence_index: z.number().int().min(1).nullable(),
  coach_notes: z.string().nullable(),
  client_notes: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
  cancelled_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
});

export const insertBookingSchema = bookingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  cancelled_at: true,
  completed_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  cancelled_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
});

export const updateBookingSchema = insertBookingSchema.partial();

// Booking Notification Schema
export const bookingNotificationSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid().nullable(),
  recipient_id: z.string().uuid(),
  notification_type: bookingNotificationTypeSchema,
  channel: notificationChannelSchema,
  scheduled_for: z.string().datetime(),
  sent_at: z.string().datetime().nullable(),
  status: notificationStatusSchema.default('pending'),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().datetime().nullable(),
});

export const insertBookingNotificationSchema = bookingNotificationSchema.omit({
  id: true,
  created_at: true,
  sent_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  sent_at: z.string().datetime().optional(),
});

export const updateBookingNotificationSchema = insertBookingNotificationSchema.partial();

// Coach Block Schema (Personal blocks for unavailability)
export const coachBlockSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  block_type: coachBlockTypeSchema,
  custom_reason: z.string().nullable(),
  start_date: z.string(), // DATE format YYYY-MM-DD
  end_date: z.string(), // DATE format YYYY-MM-DD
  start_time: z.string().nullable(), // TIME format HH:MM:SS - null = full day
  end_time: z.string().nullable(), // TIME format HH:MM:SS - null = full day
  notes: z.string().nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertCoachBlockSchema = coachBlockSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateCoachBlockSchema = insertCoachBlockSchema.partial();

// Gap Details Schema (for optimization suggestions)
export const gapDetailsSchema = z.object({
  originalDate: z.string(),
  originalStartTime: z.string(),
  originalEndTime: z.string(),
  gapBeforeMinutes: z.number().int().optional(),
  gapAfterMinutes: z.number().int().optional(),
  freedMinutes: z.number().int().optional(),
  newBlockSize: z.number().int().optional(),
});
export type GapDetails = z.infer<typeof gapDetailsSchema>;

// Calendar Optimization Suggestion Schema
export const calendarOptimizationSuggestionSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  suggestion_type: optimizationSuggestionTypeSchema,
  source_booking_id: z.string().uuid(),
  client_id: z.string().uuid(),
  // Proposed change
  proposed_date: z.string(), // DATE format YYYY-MM-DD
  proposed_start_time: z.string(), // TIME format HH:MM:SS
  proposed_end_time: z.string(), // TIME format HH:MM:SS
  // Gap analysis
  gap_details: gapDetailsSchema.or(z.record(z.string(), z.unknown())),
  reason_short: z.string().max(100),
  reason_detailed: z.string().nullable(),
  benefit_score: z.number().int().min(0).max(100),
  client_preference_score: z.number().int().min(0).max(100).default(50),
  // Status
  status: optimizationSuggestionStatusSchema.default('pending'),
  created_at: z.string().datetime().nullable(),
  reviewed_at: z.string().datetime().nullable(),
  expires_at: z.string().datetime(),
});

export const insertCalendarOptimizationSuggestionSchema = calendarOptimizationSuggestionSchema.omit({
  id: true,
  created_at: true,
  reviewed_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  reviewed_at: z.string().datetime().optional(),
});

export const updateCalendarOptimizationSuggestionSchema = insertCalendarOptimizationSuggestionSchema.partial();

// Block Conflict type (for UI)
export const blockConflictSchema = z.object({
  booking_id: z.string().uuid(),
  client_id: z.string().uuid(),
  client_name: z.string(),
  scheduled_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.string(),
});
export type BlockConflict = z.infer<typeof blockConflictSchema>;

// Booking System Type Exports
export type CoachAvailability = z.infer<typeof coachAvailabilitySchema>;
export type InsertCoachAvailability = z.infer<typeof insertCoachAvailabilitySchema>;
export type UpdateCoachAvailability = z.infer<typeof updateCoachAvailabilitySchema>;

export type BookingPackage = z.infer<typeof bookingPackageSchema>;
export type InsertBookingPackage = z.infer<typeof insertBookingPackageSchema>;
export type UpdateBookingPackage = z.infer<typeof updateBookingPackageSchema>;

export type Booking = z.infer<typeof bookingSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type UpdateBooking = z.infer<typeof updateBookingSchema>;

export type BookingNotification = z.infer<typeof bookingNotificationSchema>;
export type InsertBookingNotification = z.infer<typeof insertBookingNotificationSchema>;
export type UpdateBookingNotification = z.infer<typeof updateBookingNotificationSchema>;

export type CoachBlock = z.infer<typeof coachBlockSchema>;
export type InsertCoachBlock = z.infer<typeof insertCoachBlockSchema>;
export type UpdateCoachBlock = z.infer<typeof updateCoachBlockSchema>;

export type CalendarOptimizationSuggestion = z.infer<typeof calendarOptimizationSuggestionSchema>;
export type InsertCalendarOptimizationSuggestion = z.infer<typeof insertCalendarOptimizationSuggestionSchema>;
export type UpdateCalendarOptimizationSuggestion = z.infer<typeof updateCalendarOptimizationSuggestionSchema>;

// =====================================================
// Cancellation Policy Schemas
// =====================================================

export const coachCancellationPolicySchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  free_cancellation_hours: z.number().int().min(0).max(168).default(24),
  late_cancel_charges_session: z.boolean().default(true),
  late_cancel_refund_percentage: z.number().int().min(0).max(100).default(0),
  policy_summary_en: z.string().nullable(),
  policy_summary_it: z.string().nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertCoachCancellationPolicySchema = coachCancellationPolicySchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateCoachCancellationPolicySchema = insertCoachCancellationPolicySchema.partial();

export type CoachCancellationPolicy = z.infer<typeof coachCancellationPolicySchema>;
export type InsertCoachCancellationPolicy = z.infer<typeof insertCoachCancellationPolicySchema>;
export type UpdateCoachCancellationPolicy = z.infer<typeof updateCoachCancellationPolicySchema>;

// Cancellation status check result
export const cancellationStatusSchema = z.object({
  isLate: z.boolean(),
  hoursUntilBooking: z.number(),
  willChargeSession: z.boolean(),
  policyHours: z.number().int(),
});
export type CancellationStatus = z.infer<typeof cancellationStatusSchema>;

// =====================================================
// Booking Waitlist Schemas
// =====================================================

export const bookingWaitlistStatusSchema = z.enum(['active', 'notified', 'booked', 'expired', 'cancelled']);
export type BookingWaitlistStatus = z.infer<typeof bookingWaitlistStatusSchema>;

export const bookingWaitlistEntrySchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  client_id: z.string().uuid(),
  preferred_days: z.array(z.number().int().min(0).max(6)).default([]),
  preferred_time_start: z.string().nullable(), // TIME format HH:MM:SS
  preferred_time_end: z.string().nullable(), // TIME format HH:MM:SS
  urgency_level: z.number().int().min(0).max(100).default(50),
  notes: z.string().nullable(),
  package_id: z.string().uuid().nullable(),
  ai_priority_score: z.number().int().min(0).max(100).default(50),
  ai_score_reason: z.string().nullable(),
  status: bookingWaitlistStatusSchema.default('active'),
  notified_at: z.string().datetime().nullable(),
  response_deadline: z.string().datetime().nullable(),
  responded_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

export const insertBookingWaitlistEntrySchema = bookingWaitlistEntrySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  ai_priority_score: true,
  ai_score_reason: true,
  notified_at: true,
  response_deadline: true,
  responded_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const updateBookingWaitlistEntrySchema = insertBookingWaitlistEntrySchema.partial();

export type BookingWaitlistEntry = z.infer<typeof bookingWaitlistEntrySchema>;
export type InsertBookingWaitlistEntry = z.infer<typeof insertBookingWaitlistEntrySchema>;
export type UpdateBookingWaitlistEntry = z.infer<typeof updateBookingWaitlistEntrySchema>;

// Waitlist candidate (returned from find_booking_waitlist_candidates)
export const waitlistCandidateSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  client_name: z.string(),
  preferred_days: z.array(z.number().int()).nullable(),
  preferred_time_start: z.string().nullable(),
  preferred_time_end: z.string().nullable(),
  urgency_level: z.number().int(),
  ai_priority_score: z.number().int(),
  has_active_package: z.boolean(),
  days_waiting: z.number().int(),
});
export type WaitlistCandidate = z.infer<typeof waitlistCandidateSchema>;

// =====================================================
// No-Show Alert Schemas
// =====================================================

export const clientNoShowAlertSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  client_id: z.string().uuid(),
  no_show_count: z.number().int().min(0),
  session_count: z.number().int().min(1),
  no_show_rate: z.number().min(0).max(100),
  acknowledged_at: z.string().datetime().nullable(),
  coach_notes: z.string().nullable(),
  created_at: z.string().datetime().nullable(),
});

export const insertClientNoShowAlertSchema = clientNoShowAlertSchema.omit({
  id: true,
  created_at: true,
  acknowledged_at: true
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
});

export const updateClientNoShowAlertSchema = z.object({
  acknowledged_at: z.string().datetime().optional(),
  coach_notes: z.string().optional(),
});

export type ClientNoShowAlert = z.infer<typeof clientNoShowAlertSchema>;
export type InsertClientNoShowAlert = z.infer<typeof insertClientNoShowAlertSchema>;
export type UpdateClientNoShowAlert = z.infer<typeof updateClientNoShowAlertSchema>;

// No-show stats (returned from get_client_no_show_stats)
export const noShowStatsSchema = z.object({
  no_show_count: z.number().int(),
  session_count: z.number().int(),
  no_show_rate: z.number(),
  exceeds_threshold: z.boolean(),
});
export type NoShowStats = z.infer<typeof noShowStatsSchema>;

// Pending alert with client name (for UI)
export const pendingNoShowAlertSchema = z.object({
  alert_id: z.string().uuid(),
  client_id: z.string().uuid(),
  client_name: z.string(),
  no_show_count: z.number().int(),
  session_count: z.number().int(),
  no_show_rate: z.number(),
  alert_created_at: z.string().datetime(),
});
export type PendingNoShowAlert = z.infer<typeof pendingNoShowAlertSchema>;

// =====================================================
// Package Upgrade Suggestion Schemas
// =====================================================

export const packageUpgradeSuggestionStatusSchema = z.enum(['pending', 'sent', 'accepted', 'dismissed']);
export type PackageUpgradeSuggestionStatus = z.infer<typeof packageUpgradeSuggestionStatusSchema>;

export const packageUpgradeSuggestionReasonSchema = z.enum(['fast_usage', 'frequent_rebuy', 'high_attendance']);
export type PackageUpgradeSuggestionReason = z.infer<typeof packageUpgradeSuggestionReasonSchema>;

export const packageUpgradeSuggestionSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  client_id: z.string().uuid(),
  package_id: z.string().uuid(),
  reason: packageUpgradeSuggestionReasonSchema,
  suggested_sessions: z.number().int().min(1),
  current_sessions: z.number().int().min(1),
  days_to_complete: z.number().int().min(1),
  status: packageUpgradeSuggestionStatusSchema.default('pending'),
  sent_at: z.string().datetime().nullable(),
  responded_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().nullable(),
});

export const insertPackageUpgradeSuggestionSchema = packageUpgradeSuggestionSchema.omit({
  id: true,
  created_at: true,
}).extend({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  sent_at: z.string().datetime().nullable().optional(),
  responded_at: z.string().datetime().nullable().optional(),
});

export const updatePackageUpgradeSuggestionSchema = z.object({
  status: packageUpgradeSuggestionStatusSchema.optional(),
  sent_at: z.string().datetime().optional(),
  responded_at: z.string().datetime().optional(),
});

export type PackageUpgradeSuggestion = z.infer<typeof packageUpgradeSuggestionSchema>;
export type InsertPackageUpgradeSuggestion = z.infer<typeof insertPackageUpgradeSuggestionSchema>;
export type UpdatePackageUpgradeSuggestion = z.infer<typeof updatePackageUpgradeSuggestionSchema>;

// =====================================================
// Package Helper Types (for UI)
// =====================================================

// Expiring package (returned from get_expiring_packages)
export const expiringPackageSchema = z.object({
  package_id: z.string().uuid(),
  client_id: z.string().uuid(),
  client_name: z.string(),
  package_name: z.string(),
  end_date: z.string(), // DATE format
  days_until_expiry: z.number().int(),
  sessions_remaining: z.number().int(),
  is_shared: z.boolean(),
});
export type ExpiringPackage = z.infer<typeof expiringPackageSchema>;

// Upgrade suggestion with details (for dashboard UI)
export const upgradeSuggestionWithDetailsSchema = packageUpgradeSuggestionSchema.extend({
  client_name: z.string(),
  package_name: z.string(),
});
export type UpgradeSuggestionWithDetails = z.infer<typeof upgradeSuggestionWithDetailsSchema>;

// Shared package usage breakdown
export const sharedPackageUsageSchema = z.object({
  client_id: z.string().uuid(),
  client_name: z.string(),
  sessions_used: z.number().int(),
  percentage: z.number(),
});
export type SharedPackageUsage = z.infer<typeof sharedPackageUsageSchema>;
