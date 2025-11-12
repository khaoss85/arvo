/**
 * Equipment to Representative Exercise Mapping
 * Maps each equipment ID to an iconic exercise that demonstrates its use
 * Exercise names are matched against ExerciseDB for GIF animations
 */

export interface EquipmentExerciseMapping {
  equipmentId: string
  exerciseName: string // Name to search in ExerciseDB
  description?: string // Optional short description for the modal
}

/**
 * Get representative exercise for equipment
 * Returns the most iconic exercise that demonstrates the equipment's use
 */
export const EQUIPMENT_EXERCISE_MAP: Record<string, EquipmentExerciseMapping> = {
  // Free Weights
  barbell: {
    equipmentId: 'barbell',
    exerciseName: 'barbell squat',
    description: 'Classic compound movement for legs',
  },
  dumbbells: {
    equipmentId: 'dumbbells',
    exerciseName: 'dumbbell bench press',
    description: 'Versatile pressing movement',
  },
  ez_bar: {
    equipmentId: 'ez_bar',
    exerciseName: 'ez barbell curl',
    description: 'Bicep isolation with ergonomic grip',
  },
  trap_bar: {
    equipmentId: 'trap_bar',
    exerciseName: 'trap bar deadlift',
    description: 'Back-friendly deadlift variation',
  },
  kettlebells: {
    equipmentId: 'kettlebells',
    exerciseName: 'kettlebell swing',
    description: 'Dynamic hip hinge movement',
  },

  // Cable Machines
  cable_station: {
    equipmentId: 'cable_station',
    exerciseName: 'cable chest fly',
    description: 'Constant tension chest isolation',
  },
  cable_crossover: {
    equipmentId: 'cable_crossover',
    exerciseName: 'cable crossover',
    description: 'Classic chest fly variation',
  },
  lat_pulldown: {
    equipmentId: 'lat_pulldown',
    exerciseName: 'cable wide grip lat pulldown',
    description: 'Back width development',
  },
  seated_cable_row: {
    equipmentId: 'seated_cable_row',
    exerciseName: 'cable seated row',
    description: 'Back thickness builder',
  },
  cable_tricep: {
    equipmentId: 'cable_tricep',
    exerciseName: 'cable triceps pushdown',
    description: 'Tricep isolation movement',
  },
  cable_curl: {
    equipmentId: 'cable_curl',
    exerciseName: 'cable curl',
    description: 'Bicep with constant tension',
  },

  // Plate-Loaded Machines
  t_bar_row: {
    equipmentId: 't_bar_row',
    exerciseName: 'leverage t bar row',
    description: 'Back thickness development',
  },
  linear_leg_press: {
    equipmentId: 'linear_leg_press',
    exerciseName: 'leg press',
    description: 'Quad and glute builder',
  },
  hack_squat: {
    equipmentId: 'hack_squat',
    exerciseName: 'hack squat',
    description: 'Quad-focused squat variation',
  },
  belt_squat: {
    equipmentId: 'belt_squat',
    exerciseName: 'barbell squat', // Fallback as belt squat might not be in DB
    description: 'Low back-friendly leg training',
  },
  v_squat: {
    equipmentId: 'v_squat',
    exerciseName: 'hack squat', // Similar movement pattern
    description: 'Deep quad stretch',
  },
  pendulum_squat: {
    equipmentId: 'pendulum_squat',
    exerciseName: 'hack squat', // Similar movement pattern
    description: 'Deep ROM quad builder',
  },
  plate_chest_press: {
    equipmentId: 'plate_chest_press',
    exerciseName: 'lever chest press',
    description: 'Natural pressing movement',
  },
  plate_shoulder_press: {
    equipmentId: 'plate_shoulder_press',
    exerciseName: 'lever shoulder press',
    description: 'Overhead pressing',
  },
  lever_row: {
    equipmentId: 'lever_row',
    exerciseName: 'leverage row',
    description: 'Back row variation',
  },

  // Selectorized Machines
  chest_press_machine: {
    equipmentId: 'chest_press_machine',
    exerciseName: 'lever chest press',
    description: 'Safe horizontal pressing',
  },
  pec_fly: {
    equipmentId: 'pec_fly',
    exerciseName: 'pec deck fly',
    description: 'Chest isolation with stretch',
  },
  incline_press_machine: {
    equipmentId: 'incline_press_machine',
    exerciseName: 'lever incline chest press',
    description: 'Upper chest focus',
  },
  seated_row_machine: {
    equipmentId: 'seated_row_machine',
    exerciseName: 'lever seated row',
    description: 'Back thickness',
  },
  machine_pullover: {
    equipmentId: 'machine_pullover',
    exerciseName: 'lever pullover',
    description: 'Lat stretch and width',
  },
  rear_delt_fly: {
    equipmentId: 'rear_delt_fly',
    exerciseName: 'cable rear delt fly',
    description: 'Rear shoulder isolation',
  },
  shoulder_press_machine: {
    equipmentId: 'shoulder_press_machine',
    exerciseName: 'lever shoulder press',
    description: 'Safe overhead pressing',
  },
  lateral_raise_machine: {
    equipmentId: 'lateral_raise_machine',
    exerciseName: 'cable lateral raise',
    description: 'Side delt development',
  },
  leg_press_45: {
    equipmentId: 'leg_press_45',
    exerciseName: 'leg press',
    description: 'Quad and glute development',
  },
  leg_extension: {
    equipmentId: 'leg_extension',
    exerciseName: 'leg extension',
    description: 'Quad isolation',
  },
  leg_curl_lying: {
    equipmentId: 'leg_curl_lying',
    exerciseName: 'lying leg curl',
    description: 'Hamstring in shortened position',
  },
  leg_curl_seated: {
    equipmentId: 'leg_curl_seated',
    exerciseName: 'seated leg curl',
    description: 'Hamstring in lengthened position',
  },
  seated_calf_raise: {
    equipmentId: 'seated_calf_raise',
    exerciseName: 'seated calf raise',
    description: 'Soleus focus',
  },
  standing_calf_raise: {
    equipmentId: 'standing_calf_raise',
    exerciseName: 'standing calf raise',
    description: 'Gastrocnemius development',
  },
  kick_machine: {
    equipmentId: 'kick_machine',
    exerciseName: 'cable kickback',
    description: 'Glute isolation',
  },
  smith_machine: {
    equipmentId: 'smith_machine',
    exerciseName: 'smith squat',
    description: 'Guided barbell movements',
  },
  preacher_curl_machine: {
    equipmentId: 'preacher_curl_machine',
    exerciseName: 'lever preacher curl',
    description: 'Bicep isolation',
  },
  tricep_extension_machine: {
    equipmentId: 'tricep_extension_machine',
    exerciseName: 'triceps extension',
    description: 'Tricep stretch and isolation',
  },

  // Bodyweight Stations
  pull_up_bar: {
    equipmentId: 'pull_up_bar',
    exerciseName: 'pull up',
    description: 'Back width and strength',
  },
  dip_station: {
    equipmentId: 'dip_station',
    exerciseName: 'chest dip',
    description: 'Chest and tricep builder',
  },
  parallel_bars: {
    equipmentId: 'parallel_bars',
    exerciseName: 'chest dip',
    description: 'Bodyweight pressing',
  },
  captain_chair: {
    equipmentId: 'captain_chair',
    exerciseName: 'hanging leg raise',
    description: 'Core and hip flexor work',
  },
  rings: {
    equipmentId: 'rings',
    exerciseName: 'ring dip',
    description: 'Advanced stability training',
  },

  // Specialty Equipment
  preacher_bench: {
    equipmentId: 'preacher_bench',
    exerciseName: 'barbell preacher curl',
    description: 'Strict bicep curls',
  },
  glute_ham_raise: {
    equipmentId: 'glute_ham_raise',
    exerciseName: 'glute ham raise',
    description: 'Hamstring eccentric strength',
  },
  reverse_hyper: {
    equipmentId: 'reverse_hyper',
    exerciseName: 'hyperextension',
    description: 'Lower back and glutes',
  },
  sissy_squat: {
    equipmentId: 'sissy_squat',
    exerciseName: 'sissy squat',
    description: 'Extreme quad stretch',
  },
  leg_press_horizontal: {
    equipmentId: 'leg_press_horizontal',
    exerciseName: 'leg press',
    description: 'Hip-dominant leg press',
  },
  adductor_machine: {
    equipmentId: 'adductor_machine',
    exerciseName: 'hip adduction machine',
    description: 'Inner thigh isolation',
  },
  abductor_machine: {
    equipmentId: 'abductor_machine',
    exerciseName: 'hip abduction machine',
    description: 'Outer glute isolation',
  },
}

/**
 * Get representative exercise for equipment
 */
export function getRepresentativeExercise(
  equipmentId: string
): EquipmentExerciseMapping | null {
  return EQUIPMENT_EXERCISE_MAP[equipmentId] || null
}

/**
 * Check if equipment has a representative exercise
 */
export function hasRepresentativeExercise(equipmentId: string): boolean {
  return equipmentId in EQUIPMENT_EXERCISE_MAP
}
