import { z } from "zod";

// Training Approaches Schema
export const trainingApproachSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  creator: z.string().nullable(),
  philosophy: z.string().nullable(),
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
  equipment_preferences: z.record(z.string(), z.unknown()).nullable(),
  preferred_split: z.string().nullable(),
});

export const insertUserProfileSchema = userProfileSchema;

export const updateUserProfileSchema = userProfileSchema.partial().required({ user_id: true });

// Exercises Schema
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

// Workouts Schema
export const workoutSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  approach_id: z.string().uuid().nullable(),
  planned_at: z.string().date().nullable(),
  exercises: z.array(z.record(z.string(), z.unknown())).nullable(),
  completed: z.boolean().nullable(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  duration_seconds: z.number().int().min(0).nullable(),
  total_volume: z.number().min(0).nullable(),
  total_sets: z.number().int().min(0).nullable(),
  notes: z.string().nullable(),
  workout_type: z.enum(['push', 'pull', 'legs', 'upper', 'lower', 'full_body']).nullable(),
  workout_name: z.string().nullable(),
  target_muscle_groups: z.array(z.string()).nullable(),
  split_type: z.string().nullable(),
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
  set_number: z.number().int().min(1).nullable(),
  weight_target: z.number().min(0).nullable(),
  weight_actual: z.number().min(0).nullable(),
  reps_target: z.number().int().min(1).nullable(),
  reps_actual: z.number().int().min(0).nullable(),
  rir_actual: z.number().int().min(0).max(10).nullable(),
  notes: z.string().nullable(),
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
