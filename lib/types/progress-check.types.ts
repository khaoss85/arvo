import { z} from 'zod';
import { Tables, TablesInsert, TablesUpdate } from './database.types';

// Database types
export type ProgressCheck = Tables<'progress_checks'>;
export type ProgressPhoto = Tables<'progress_photos'>;
export type BodyMeasurement = Tables<'body_measurements'>;

export type ProgressCheckInsert = TablesInsert<'progress_checks'>;
export type ProgressPhotoInsert = TablesInsert<'progress_photos'>;
export type BodyMeasurementInsert = TablesInsert<'body_measurements'>;

export type ProgressCheckUpdate = TablesUpdate<'progress_checks'>;

// Photo types
export const PHOTO_TYPES = ['front', 'side_left', 'side_right', 'back'] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

// Measurement types
export const MEASUREMENT_TYPES = [
  'waist',
  'chest',
  'arm_left',
  'arm_right',
  'thigh_left',
  'thigh_right',
  'hips',
  'shoulders',
  'calf_left',
  'calf_right',
] as const;
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

// Enriched types with relations
export interface ProgressCheckWithPhotos extends ProgressCheck {
  photos: ProgressPhoto[];
}

export interface ProgressCheckWithDetails extends ProgressCheck {
  photos: ProgressPhoto[];
  measurements: BodyMeasurement[];
}

// Form data types
export interface CreateCheckFormData {
  photos: {
    front?: File;
    side_left?: File;
    side_right?: File;
    back?: File;
  };
  weight?: number;
  notes?: string;
  measurements?: {
    type: MeasurementType;
    value: number;
  }[];
  isMilestone?: boolean;
}

// Zod schemas for validation
export const photoTypeSchema = z.enum(PHOTO_TYPES);

export const measurementTypeSchema = z.enum(MEASUREMENT_TYPES);

export const bodyMeasurementSchema = z.object({
  type: measurementTypeSchema,
  value: z.number().positive().max(999, 'Measurement value too large'),
});

export const createCheckSchema = z.object({
  weight: z.number().positive().max(500, 'Weight must be less than 500kg').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  measurements: z.array(bodyMeasurementSchema).optional(),
  isMilestone: z.boolean().optional().default(false),
});

export type CreateCheckInput = z.infer<typeof createCheckSchema>;

// Comparison types
export interface CheckComparison {
  before: ProgressCheckWithPhotos;
  after: ProgressCheckWithPhotos;
  weightDiff?: number;
  measurementDiffs?: {
    type: MeasurementType;
    beforeValue?: number;
    afterValue?: number;
    diff?: number;
  }[];
  daysBetween: number;
}
