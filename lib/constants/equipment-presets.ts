export interface EquipmentPreset {
  id: string
  name: string
  description: string
  icon: string
  equipment: string[]
}

export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  {
    id: "full_gym",
    name: "Full Gym",
    description: "Commercial gym with complete equipment",
    icon: "🏋️",
    equipment: [
      // Free weights
      "barbell", "dumbbells", "ez_bar",
      // Cables
      "cable_station", "lat_pulldown", "seated_cable_row", "cable_crossover",
      // Machines - Legs
      "leg_press_45", "leg_extension", "leg_curl_lying", "leg_curl_seated",
      "seated_calf_raise", "standing_calf_raise",
      // Machines - Upper
      "chest_press_machine", "pec_fly", "shoulder_press_machine",
      "seated_row_machine", "lateral_raise_machine",
      // Bodyweight
      "pull_up_bar", "dip_station",
      // Plate-loaded
      "t_bar_row", "linear_leg_press", "hack_squat"
    ]
  },

  {
    id: "home_gym_basic",
    name: "Home Gym (Basic)",
    description: "Dumbbells, bench, pull-up bar",
    icon: "🏠",
    equipment: ["dumbbells", "pull_up_bar"]
  },

  {
    id: "home_gym_advanced",
    name: "Home Gym (Advanced)",
    description: "Full home setup with barbell and rack",
    icon: "🏘️",
    equipment: [
      "barbell", "dumbbells", "ez_bar",
      "pull_up_bar", "dip_station"
    ]
  },

  {
    id: "machines_only",
    name: "Machines Only",
    description: "All machines, no free weights",
    icon: "🤖",
    equipment: [
      // Legs
      "leg_press_45", "leg_extension", "leg_curl_lying", "leg_curl_seated",
      "seated_calf_raise", "standing_calf_raise", "kick_machine",
      // Chest
      "chest_press_machine", "pec_fly", "incline_press_machine",
      // Back
      "seated_row_machine", "lat_pulldown", "rear_delt_fly", "machine_pullover",
      // Shoulders
      "shoulder_press_machine", "lateral_raise_machine",
      // Cables
      "cable_station", "cable_crossover", "seated_cable_row"
    ]
  },

  {
    id: "free_weights_only",
    name: "Free Weights Only",
    description: "Barbell, dumbbells, bodyweight",
    icon: "🆓",
    equipment: [
      "barbell", "dumbbells", "ez_bar", "trap_bar",
      "pull_up_bar", "dip_station"
    ]
  },

  {
    id: "minimal",
    name: "Minimal Setup",
    description: "Just the essentials",
    icon: "⚡",
    equipment: ["dumbbells", "pull_up_bar"]
  }
]
