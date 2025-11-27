export interface EquipmentItem {
  id: string
  label: string
  commonFor: string[]
}

export interface EquipmentCategory {
  label: string
  icon: string
  items: EquipmentItem[]
}

export interface EquipmentTaxonomy {
  [categoryId: string]: EquipmentCategory
}

export const EQUIPMENT_TAXONOMY: EquipmentTaxonomy = {
  free_weights: {
    label: "Free Weights",
    icon: "💪",
    items: [
      { id: "barbell", label: "Barbell", commonFor: ["Compound lifts", "Heavy loading"] },
      { id: "dumbbells", label: "Dumbbells", commonFor: ["Versatile training", "Unilateral work"] },
      { id: "ez_bar", label: "EZ Bar", commonFor: ["Curls", "Skullcrushers"] },
      { id: "trap_bar", label: "Trap Bar / Hex Bar", commonFor: ["Deadlifts", "Carries"] },
      { id: "kettlebells", label: "Kettlebells", commonFor: ["Dynamic movements", "Swings"] },
    ]
  },

  cable_machines: {
    label: "Cable Machines",
    icon: "🔗",
    items: [
      { id: "cable_station", label: "Cable Station (Stazione Cavo)", commonFor: ["Isolation", "Constant tension"] },
      { id: "cable_crossover", label: "Cable Crossover", commonFor: ["Chest flies", "Rear delts"] },
      { id: "lat_pulldown", label: "Lat Pulldown Machine", commonFor: ["Back width", "Vertical pull"] },
      { id: "seated_cable_row", label: "Seated Cable Row", commonFor: ["Back thickness", "Horizontal pull"] },
      { id: "cable_tricep", label: "Cable Tricep Station", commonFor: ["Tricep isolation", "Pushdowns"] },
      { id: "cable_curl", label: "Cable Curl Station", commonFor: ["Bicep isolation", "Constant tension"] },
    ]
  },

  plate_loaded_machines: {
    label: "Plate-Loaded Machines",
    icon: "🏋️",
    items: [
      { id: "t_bar_row", label: "T-Bar Row", commonFor: ["Back thickness", "Mid-back"] },
      { id: "linear_leg_press", label: "Linear Leg Press", commonFor: ["Quad development", "Glutes"] },
      { id: "hack_squat", label: "Hack Squat", commonFor: ["Quad focus", "VMO development"] },
      { id: "belt_squat", label: "Belt Squat", commonFor: ["Low back-friendly squats"] },
      { id: "v_squat", label: "V-Squat Machine", commonFor: ["Quad isolation", "Lengthened bias"] },
      { id: "pendulum_squat", label: "Pendulum Squat", commonFor: ["Quad stretch", "Deep ROM"] },
      { id: "plate_chest_press", label: "Plate-Loaded Chest Press", commonFor: ["Chest compound", "Natural path"] },
      { id: "plate_shoulder_press", label: "Plate-Loaded Shoulder Press", commonFor: ["Shoulder compound"] },
      { id: "lever_row", label: "Lever Row Machine", commonFor: ["Back rows", "Unilateral option"] },
    ]
  },

  selectorized_machines: {
    label: "Selectorized Machines",
    icon: "⚙️",
    items: [
      // Chest
      { id: "chest_press_machine", label: "Chest Press Machine", commonFor: ["Horizontal push", "Safer pressing"] },
      { id: "pec_fly", label: "Pec Fly / Pec Deck", commonFor: ["Chest isolation", "Lengthened stretch"] },
      { id: "incline_press_machine", label: "Incline Press Machine", commonFor: ["Upper chest", "Clavicular head"] },

      // Back
      { id: "seated_row_machine", label: "Seated Row Machine", commonFor: ["Back thickness", "Mid-back"] },
      { id: "machine_pullover", label: "Machine Pullover", commonFor: ["Lats stretch", "Back width"] },
      { id: "rear_delt_fly", label: "Rear Delt Fly Machine", commonFor: ["Rear delts", "Upper back"] },

      // Shoulders
      { id: "shoulder_press_machine", label: "Shoulder Press Machine", commonFor: ["Vertical push", "Safer overhead"] },
      { id: "lateral_raise_machine", label: "Lateral Raise Machine", commonFor: ["Side delts", "Medial head"] },

      // Legs
      { id: "leg_press_45", label: "Leg Press (45°)", commonFor: ["Quad development", "Glutes"] },
      { id: "leg_extension", label: "Leg Extension", commonFor: ["Quad isolation", "VMO focus"] },
      { id: "leg_curl_lying", label: "Leg Curl (Lying)", commonFor: ["Hamstring isolation", "Shortened position"] },
      { id: "leg_curl_seated", label: "Leg Curl (Seated)", commonFor: ["Hamstring isolation", "Lengthened position"] },
      { id: "leg_curl_prone", label: "Leg Curl (Prone)", commonFor: ["Hamstring isolation", "Face-down position"] },
      { id: "leg_curl_standing", label: "Leg Curl (Standing)", commonFor: ["Hamstring isolation", "Unilateral work"] },
      { id: "seated_calf_raise", label: "Seated Calf Raise", commonFor: ["Soleus focus", "Knee bent"] },
      { id: "standing_calf_raise", label: "Standing Calf Raise", commonFor: ["Gastrocnemius", "Knee extended"] },
      { id: "kick_machine", label: "Kick Machine / Glute Press", commonFor: ["Glute isolation", "Hip extension"] },
      { id: "hip_thrust_machine", label: "Hip Thrust Machine", commonFor: ["Glute isolation", "Hip thrust", "Glute hypertrophy"] },
      { id: "multi_hip_machine", label: "Multi-Hip Machine", commonFor: ["Hip abduction", "Hip adduction", "Hip flexion"] },
      { id: "smith_machine", label: "Smith Machine", commonFor: ["Guided barbell paths", "Safer solo training"] },

      // Core/Abs
      { id: "ab_crunch_machine", label: "Ab Crunch Machine", commonFor: ["Abs isolation", "Weighted crunches"] },
      { id: "torso_rotation_machine", label: "Torso Rotation Machine", commonFor: ["Obliques", "Core rotation"] },
      { id: "back_extension_machine", label: "Back Extension / Roman Chair / 45° Back Extension", commonFor: ["Lower back", "Glutes", "Spinal erectors"] },

      // Arms
      { id: "preacher_curl_machine", label: "Preacher Curl Machine", commonFor: ["Bicep isolation", "Peak contraction"] },
      { id: "bicep_curl_machine", label: "Bicep Curl Machine (Seated)", commonFor: ["Bicep isolation", "Constant tension"] },
      { id: "tricep_extension_machine", label: "Tricep Extension Machine", commonFor: ["Tricep isolation", "Long head stretch"] },

      // Multi-function
      { id: "assisted_pullup_dip", label: "Assisted Pull-up / Dip Machine", commonFor: ["Assisted pull-ups", "Assisted dips", "Beginner-friendly"] },
      { id: "decline_press_machine", label: "Decline Press Machine", commonFor: ["Lower chest", "Decline pressing"] },
    ]
  },

  bodyweight_stations: {
    label: "Bodyweight Stations",
    icon: "🤸",
    items: [
      { id: "pull_up_bar", label: "Pull-Up Bar", commonFor: ["Back width", "Vertical pull"] },
      { id: "dip_station", label: "Dip Station", commonFor: ["Chest", "Triceps"] },
      { id: "parallel_bars", label: "Parallel Bars", commonFor: ["Dips", "L-sits"] },
      { id: "captain_chair", label: "Captain's Chair", commonFor: ["Abs", "Leg raises"] },
      { id: "rings", label: "Gymnastic Rings", commonFor: ["Advanced bodyweight", "Stability"] },
    ]
  },

  specialty_equipment: {
    label: "Specialty Equipment",
    icon: "🎯",
    items: [
      { id: "preacher_bench", label: "Preacher Bench", commonFor: ["Bicep isolation", "Strict form"] },
      { id: "glute_ham_raise", label: "Glute Ham Raise (GHR)", commonFor: ["Hamstrings", "Glutes", "Eccentric strength"] },
      { id: "reverse_hyper", label: "Reverse Hyperextension", commonFor: ["Lower back", "Glutes", "Decompression"] },
      { id: "sissy_squat", label: "Sissy Squat Bench", commonFor: ["Quad stretch", "VMO focus"] },
      { id: "leg_press_horizontal", label: "Horizontal Leg Press", commonFor: ["Glute bias", "Hip dominant"] },
      { id: "adductor_machine", label: "Adductor Machine", commonFor: ["Inner thighs", "Groin"] },
      { id: "abductor_machine", label: "Abductor Machine", commonFor: ["Outer glutes", "Hip abduction"] },
    ]
  },

  cardio: {
    label: "Cardio Equipment",
    icon: "🏃",
    items: [
      { id: "treadmill", label: "Treadmill", commonFor: ["Running", "Walking", "LISS cardio"] },
      { id: "stationary_bike", label: "Stationary Bike (Upright)", commonFor: ["Cycling", "Low-impact cardio"] },
      { id: "recumbent_bike", label: "Recumbent Bike", commonFor: ["Low-impact cycling", "Back support"] },
      { id: "rowing_machine", label: "Rowing Machine", commonFor: ["Full-body cardio", "Low-impact"] },
      { id: "elliptical", label: "Elliptical Trainer", commonFor: ["Low-impact cardio", "Cross-training"] },
      { id: "stair_climber", label: "Stair Climber / StairMaster", commonFor: ["Stair climbing", "Glute engagement"] },
      { id: "assault_bike", label: "Assault Bike / Air Bike", commonFor: ["HIIT", "Full-body conditioning"] },
      { id: "ski_erg", label: "Ski Erg", commonFor: ["Upper body cardio", "Ski simulation"] },
    ]
  },

  benches_racks: {
    label: "Benches & Racks",
    icon: "🪑",
    items: [
      { id: "flat_bench", label: "Flat Bench", commonFor: ["Bench press", "Dumbbell work", "Rows"] },
      { id: "adjustable_bench", label: "Adjustable Bench (Incline/Decline)", commonFor: ["Versatile pressing", "Multiple angles"] },
      { id: "incline_bench", label: "Incline Bench (Fixed)", commonFor: ["Incline press", "Upper chest"] },
      { id: "decline_bench", label: "Decline Bench (Fixed)", commonFor: ["Decline press", "Lower chest"] },
      { id: "power_rack", label: "Power Rack / Squat Rack", commonFor: ["Squats", "Bench press", "Safety training"] },
      { id: "half_rack", label: "Half Rack", commonFor: ["Squats", "Space-efficient"] },
      { id: "squat_stands", label: "Squat Stands", commonFor: ["Squats", "Minimal setup"] },
      { id: "olympic_platform", label: "Olympic Lifting Platform", commonFor: ["Olympic lifts", "Heavy drops"] },
      { id: "deadlift_platform", label: "Deadlift Platform", commonFor: ["Deadlifts", "Floor protection"] },
    ]
  },

  resistance_accessories: {
    label: "Resistance Accessories",
    icon: "🔄",
    items: [
      { id: "resistance_bands", label: "Resistance Bands", commonFor: ["Warm-up", "Accommodating resistance", "Rehab"] },
      { id: "chains", label: "Chains", commonFor: ["Accommodating resistance", "Powerlifting"] },
      { id: "ab_wheel", label: "Ab Wheel", commonFor: ["Core training", "Anti-extension"] },
    ]
  },

  functional_equipment: {
    label: "Functional Equipment",
    icon: "⚡",
    items: [
      { id: "trx_suspension", label: "TRX / Suspension Trainer", commonFor: ["Bodyweight training", "Core stability"] },
      { id: "medicine_ball", label: "Medicine Ball", commonFor: ["Throws", "Rotational work", "Power"] },
      { id: "battle_ropes", label: "Battle Ropes", commonFor: ["HIIT", "Conditioning", "Upper body endurance"] },
      { id: "landmine", label: "Landmine", commonFor: ["Press variations", "Rows", "Rotational movements"] },
      { id: "sled_prowler", label: "Sled / Prowler", commonFor: ["Conditioning", "Leg drive", "GPP"] },
    ]
  }
}

// Helper function to find equipment by ID
export function findEquipmentById(id: string): EquipmentItem | undefined {
  for (const category of Object.values(EQUIPMENT_TAXONOMY)) {
    const item = category.items.find(item => item.id === id)
    if (item) return item
  }
  return undefined
}

// Helper function to get equipment label
export function getEquipmentLabel(id: string): string {
  return findEquipmentById(id)?.label || id
}

// Helper function to get category for equipment
export function getCategoryForEquipment(equipmentId: string): string | undefined {
  for (const [categoryId, category] of Object.entries(EQUIPMENT_TAXONOMY)) {
    if (category.items.some(item => item.id === equipmentId)) {
      return categoryId
    }
  }
  return undefined
}

// Helper function to get all equipment in a category
export function getEquipmentByCategory(categoryId: string): EquipmentItem[] {
  return EQUIPMENT_TAXONOMY[categoryId]?.items || []
}

// Get all equipment IDs (useful for validation)
export function getAllEquipmentIds(): string[] {
  const ids: string[] = []
  for (const category of Object.values(EQUIPMENT_TAXONOMY)) {
    for (const item of category.items) {
      ids.push(item.id)
    }
  }
  return ids
}
