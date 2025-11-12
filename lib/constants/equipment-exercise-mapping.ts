/**
 * Equipment to Representative Exercises Mapping
 * Maps each equipment ID to 2-3 popular exercises that demonstrate its use
 * Exercise names are matched against ExerciseDB for GIF animations
 */

export interface ExerciseExample {
  name: string // Exercise name to search in ExerciseDB
  description: string // Short description of the exercise
}

export interface EquipmentExerciseMapping {
  equipmentId: string
  exercises: ExerciseExample[] // 2-3 popular exercises for this equipment
}

/**
 * Get representative exercises for equipment
 * Returns 2-3 popular exercises that demonstrate the equipment's use
 */
export const EQUIPMENT_EXERCISE_MAP: Record<string, EquipmentExerciseMapping> = {
  // Free Weights
  barbell: {
    equipmentId: 'barbell',
    exercises: [
      { name: 'barbell squat', description: 'Classic compound leg movement' },
      { name: 'barbell bench press', description: 'Essential chest pressing' },
      { name: 'barbell deadlift', description: 'Full body posterior chain' },
    ],
  },
  dumbbells: {
    equipmentId: 'dumbbells',
    exercises: [
      { name: 'dumbbell bench press', description: 'Chest pressing with full ROM' },
      { name: 'dumbbell row', description: 'Unilateral back training' },
      { name: 'dumbbell shoulder press', description: 'Overhead pressing' },
    ],
  },
  ez_bar: {
    equipmentId: 'ez_bar',
    exercises: [
      { name: 'ez barbell curl', description: 'Bicep curl with ergonomic grip' },
      { name: 'ez barbell lying triceps extension', description: 'Skullcrushers for triceps' },
    ],
  },
  trap_bar: {
    equipmentId: 'trap_bar',
    exercises: [
      { name: 'trap bar deadlift', description: 'Back-friendly deadlift variation' },
      { name: 'trap bar carry', description: 'Loaded carries for strength' },
    ],
  },
  kettlebells: {
    equipmentId: 'kettlebells',
    exercises: [
      { name: 'kettlebell swing', description: 'Dynamic hip hinge movement' },
      { name: 'kettlebell goblet squat', description: 'Front-loaded squat variation' },
    ],
  },

  // Cable Machines
  cable_station: {
    equipmentId: 'cable_station',
    exercises: [
      { name: 'cable chest fly', description: 'Chest isolation with constant tension' },
      { name: 'cable triceps pushdown', description: 'Tricep isolation movement' },
      { name: 'cable lateral raise', description: 'Side delt development' },
    ],
  },
  cable_crossover: {
    equipmentId: 'cable_crossover',
    exercises: [
      { name: 'cable crossover', description: 'Classic chest fly variation' },
      { name: 'cable rear delt fly', description: 'Rear shoulder isolation' },
    ],
  },
  lat_pulldown: {
    equipmentId: 'lat_pulldown',
    exercises: [
      { name: 'cable wide grip lat pulldown', description: 'Back width development' },
      { name: 'cable close grip lat pulldown', description: 'Lower lat focus' },
    ],
  },
  seated_cable_row: {
    equipmentId: 'seated_cable_row',
    exercises: [
      { name: 'cable seated row', description: 'Back thickness builder' },
      { name: 'cable close grip seated row', description: 'Lower back focus' },
    ],
  },
  cable_tricep: {
    equipmentId: 'cable_tricep',
    exercises: [
      { name: 'cable triceps pushdown', description: 'Tricep isolation with rope or bar' },
      { name: 'cable overhead triceps extension', description: 'Long head tricep stretch' },
    ],
  },
  cable_curl: {
    equipmentId: 'cable_curl',
    exercises: [
      { name: 'cable curl', description: 'Bicep with constant tension' },
      { name: 'cable hammer curl', description: 'Brachialis and forearm focus' },
    ],
  },

  // Plate-Loaded Machines
  t_bar_row: {
    equipmentId: 't_bar_row',
    exercises: [
      { name: 'leverage t bar row', description: 'Back thickness development' },
    ],
  },
  linear_leg_press: {
    equipmentId: 'linear_leg_press',
    exercises: [
      { name: 'leg press', description: 'Quad and glute compound' },
      { name: 'leg press calf raise', description: 'Calf development variation' },
    ],
  },
  hack_squat: {
    equipmentId: 'hack_squat',
    exercises: [
      { name: 'hack squat', description: 'Quad-focused squat variation' },
      { name: 'reverse hack squat', description: 'Glute-focused variation' },
    ],
  },
  belt_squat: {
    equipmentId: 'belt_squat',
    exercises: [
      { name: 'barbell squat', description: 'Low back-friendly leg training' },
    ],
  },
  v_squat: {
    equipmentId: 'v_squat',
    exercises: [
      { name: 'hack squat', description: 'Deep quad stretch and development' },
    ],
  },
  pendulum_squat: {
    equipmentId: 'pendulum_squat',
    exercises: [
      { name: 'hack squat', description: 'Deep ROM quad builder' },
    ],
  },
  plate_chest_press: {
    equipmentId: 'plate_chest_press',
    exercises: [
      { name: 'lever chest press', description: 'Natural pressing movement' },
      { name: 'lever incline chest press', description: 'Upper chest variation' },
    ],
  },
  plate_shoulder_press: {
    equipmentId: 'plate_shoulder_press',
    exercises: [
      { name: 'lever shoulder press', description: 'Overhead pressing movement' },
    ],
  },
  lever_row: {
    equipmentId: 'lever_row',
    exercises: [
      { name: 'leverage row', description: 'Back row variation' },
    ],
  },

  // Selectorized Machines
  chest_press_machine: {
    equipmentId: 'chest_press_machine',
    exercises: [
      { name: 'lever chest press', description: 'Safe horizontal pressing' },
    ],
  },
  pec_fly: {
    equipmentId: 'pec_fly',
    exercises: [
      { name: 'lever seated fly', description: 'Chest isolation with deep stretch' },
    ],
  },
  incline_press_machine: {
    equipmentId: 'incline_press_machine',
    exercises: [
      { name: 'lever incline chest press', description: 'Upper chest focus' },
    ],
  },
  seated_row_machine: {
    equipmentId: 'seated_row_machine',
    exercises: [
      { name: 'lever seated row', description: 'Back thickness development' },
    ],
  },
  machine_pullover: {
    equipmentId: 'machine_pullover',
    exercises: [
      { name: 'lever pullover', description: 'Lat stretch and width' },
    ],
  },
  rear_delt_fly: {
    equipmentId: 'rear_delt_fly',
    exercises: [
      { name: 'cable rear delt fly', description: 'Rear shoulder isolation' },
    ],
  },
  shoulder_press_machine: {
    equipmentId: 'shoulder_press_machine',
    exercises: [
      { name: 'lever shoulder press', description: 'Safe overhead pressing' },
    ],
  },
  lateral_raise_machine: {
    equipmentId: 'lateral_raise_machine',
    exercises: [
      { name: 'cable lateral raise', description: 'Side delt development' },
    ],
  },
  leg_press_45: {
    equipmentId: 'leg_press_45',
    exercises: [
      { name: 'leg press', description: 'Quad and glute development' },
      { name: 'leg press calf raise', description: 'Calf training variation' },
    ],
  },
  leg_extension: {
    equipmentId: 'leg_extension',
    exercises: [
      { name: 'leg extension', description: 'Quad isolation and VMO focus' },
    ],
  },
  leg_curl_lying: {
    equipmentId: 'leg_curl_lying',
    exercises: [
      { name: 'lying leg curl', description: 'Hamstring in shortened position' },
    ],
  },
  leg_curl_seated: {
    equipmentId: 'leg_curl_seated',
    exercises: [
      { name: 'seated leg curl', description: 'Hamstring in lengthened position' },
    ],
  },
  seated_calf_raise: {
    equipmentId: 'seated_calf_raise',
    exercises: [
      { name: 'seated calf raise', description: 'Soleus focus (knee bent)' },
    ],
  },
  standing_calf_raise: {
    equipmentId: 'standing_calf_raise',
    exercises: [
      { name: 'standing calf raise', description: 'Gastrocnemius development' },
    ],
  },
  kick_machine: {
    equipmentId: 'kick_machine',
    exercises: [
      { name: 'cable kickback', description: 'Glute isolation movement' },
    ],
  },
  smith_machine: {
    equipmentId: 'smith_machine',
    exercises: [
      { name: 'smith squat', description: 'Guided squat movement' },
      { name: 'smith bench press', description: 'Safer solo pressing' },
      { name: 'smith bent over row', description: 'Guided back rows' },
    ],
  },
  preacher_curl_machine: {
    equipmentId: 'preacher_curl_machine',
    exercises: [
      { name: 'lever preacher curl', description: 'Bicep isolation with peak contraction' },
    ],
  },
  tricep_extension_machine: {
    equipmentId: 'tricep_extension_machine',
    exercises: [
      { name: 'triceps extension', description: 'Tricep stretch and isolation' },
    ],
  },

  // Bodyweight Stations
  pull_up_bar: {
    equipmentId: 'pull_up_bar',
    exercises: [
      { name: 'pull up', description: 'Back width and upper body strength' },
      { name: 'chin up', description: 'Bicep-focused variation' },
    ],
  },
  dip_station: {
    equipmentId: 'dip_station',
    exercises: [
      { name: 'chest dip', description: 'Chest and tricep compound' },
      { name: 'triceps dip', description: 'Tricep-focused variation' },
    ],
  },
  parallel_bars: {
    equipmentId: 'parallel_bars',
    exercises: [
      { name: 'chest dip', description: 'Bodyweight pressing movement' },
    ],
  },
  captain_chair: {
    equipmentId: 'captain_chair',
    exercises: [
      { name: 'hanging leg raise', description: 'Core and hip flexor work' },
    ],
  },
  rings: {
    equipmentId: 'rings',
    exercises: [
      { name: 'ring dip', description: 'Advanced stability training' },
      { name: 'ring pull up', description: 'Back and stability work' },
    ],
  },

  // Specialty Equipment
  preacher_bench: {
    equipmentId: 'preacher_bench',
    exercises: [
      { name: 'barbell preacher curl', description: 'Strict bicep curls' },
      { name: 'dumbbell preacher curl', description: 'Unilateral bicep work' },
    ],
  },
  glute_ham_raise: {
    equipmentId: 'glute_ham_raise',
    exercises: [
      { name: 'glute ham raise', description: 'Hamstring eccentric strength' },
    ],
  },
  reverse_hyper: {
    equipmentId: 'reverse_hyper',
    exercises: [
      { name: 'hyperextension', description: 'Lower back and glute development' },
    ],
  },
  sissy_squat: {
    equipmentId: 'sissy_squat',
    exercises: [
      { name: 'sissy squat', description: 'Extreme quad stretch and isolation' },
    ],
  },
  leg_press_horizontal: {
    equipmentId: 'leg_press_horizontal',
    exercises: [
      { name: 'leg press', description: 'Hip-dominant leg press variation' },
    ],
  },
  adductor_machine: {
    equipmentId: 'adductor_machine',
    exercises: [
      { name: 'hip adduction machine', description: 'Inner thigh isolation' },
    ],
  },
  abductor_machine: {
    equipmentId: 'abductor_machine',
    exercises: [
      { name: 'hip abduction machine', description: 'Outer glute and hip isolation' },
    ],
  },
}

/**
 * Get representative exercises for equipment
 */
export function getRepresentativeExercises(
  equipmentId: string
): EquipmentExerciseMapping | null {
  return EQUIPMENT_EXERCISE_MAP[equipmentId] || null
}

/**
 * Check if equipment has representative exercises
 */
export function hasRepresentativeExercise(equipmentId: string): boolean {
  return equipmentId in EQUIPMENT_EXERCISE_MAP
}
