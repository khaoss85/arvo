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
      { id: "seated_calf_raise", label: "Seated Calf Raise", commonFor: ["Soleus focus", "Knee bent"] },
      { id: "standing_calf_raise", label: "Standing Calf Raise", commonFor: ["Gastrocnemius", "Knee extended"] },
      { id: "kick_machine", label: "Kick Machine / Glute Press", commonFor: ["Glute isolation", "Hip extension"] },
      { id: "smith_machine", label: "Smith Machine", commonFor: ["Guided barbell paths", "Safer solo training"] },

      // Arms
      { id: "preacher_curl_machine", label: "Preacher Curl Machine", commonFor: ["Bicep isolation", "Peak contraction"] },
      { id: "tricep_extension_machine", label: "Tricep Extension Machine", commonFor: ["Tricep isolation", "Long head stretch"] },
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
