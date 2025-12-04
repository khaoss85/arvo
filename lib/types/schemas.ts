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

// Split Plans Schema
export const splitPlanSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  approach_id: z.string().uuid().nullable(),
  split_type: z.enum(['push_pull_legs', 'upper_lower', 'full_body', 'custom', 'bro_split', 'weak_point_focus']),
  cycle_days: z.number().int().min(1), // e.g., 8 for Kuba's 3 on 1 off cycle
  sessions: z.array(z.record(z.string(), z.unknown())), // Array of SessionDefinition objects
  frequency_map: z.record(z.string(), z.number()), // muscle group -> frequency per week
  volume_distribution: z.record(z.string(), z.number()), // muscle group -> total sets in cycle
  specialization_muscle: z.string().nullable().optional(), // Target muscle for weak_point_focus split
  specialization_frequency: z.number().int().min(1).nullable().optional(), // Times per cycle
  specialization_volume_multiplier: z.number().min(1.0).max(3.0).nullable().optional(), // Volume multiplier (e.g., 1.5 = 50% more)
  ai_response_id: z.string().nullable().optional(), // OpenAI response ID for GPT-5 reasoning persistence
  active: z.boolean().nullable(),
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
  workout_type: z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'chest', 'back', 'shoulders', 'arms', 'rest']).nullable(),
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

// Workout Template Schema
export const workoutTemplateSchema = z.object({
  id: z.string().uuid(),
  coach_id: z.string().uuid(),
  name: z.string().min(1, "Template name is required"),
  description: z.string().nullable(),
  workout_type: z.array(z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'chest', 'back', 'shoulders', 'arms'])).nullable(),
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
