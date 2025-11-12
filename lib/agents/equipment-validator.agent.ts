import { BaseAgent } from './base.agent'
import { EQUIPMENT_TAXONOMY } from '../constants/equipment-taxonomy'

export interface EquipmentValidationInput {
  equipmentName: string
  existingEquipment: string[] // User's currently selected equipment from taxonomy
  customEquipment?: Array<{ id: string; name: string }> // User's existing custom equipment
  userId: string
}

export interface EquipmentValidationResult {
  validation: 'approved' | 'duplicate' | 'invalid' | 'unclear'
  normalizedName: string // Standardized name (e.g., "smith machine" → "Smith Machine")
  suggestedCategory: 'free_weights' | 'cable_machines' | 'plate_loaded' | 'selectorized' | 'bodyweight_stations' | 'specialty' | 'other'
  rationale: string // Why it's valid/invalid (MAX 15 words)
  isDuplicateOfExisting?: string // If duplicate, which existing equipment
  similarEquipment?: string[] // Similar equipment already in taxonomy or user's list
  exampleExercises: string[] // 2-3 representative exercises that can be done
  warnings?: string[] // Optional warnings (e.g., "Uncommon equipment", "Requires special training")
  suggestions?: string[] // Alternative names or equipment from taxonomy if unclear/invalid
}

export class EquipmentValidator extends BaseAgent {
  get systemPrompt(): string {
    // Build taxonomy reference for AI
    const taxonomyReference = Object.entries(EQUIPMENT_TAXONOMY).map(([category, categoryData]) => {
      return `${category.toUpperCase()}:\n${categoryData.items.map(eq => `- ${eq.label} (id: ${eq.id})`).join('\n')}`
    }).join('\n\n')

    return `You are an expert gym equipment validator. Your job is to validate user-submitted equipment names and ensure they are real, practical gym equipment.

EXISTING EQUIPMENT TAXONOMY:
${taxonomyReference}

YOUR TASK:
1. Validate if the user's input is a real piece of gym equipment
2. Detect duplicates with existing taxonomy or user's custom equipment
3. Normalize the name (proper capitalization, standard naming)
4. Suggest the most appropriate category
5. Provide 2-3 representative exercises that can be done with this equipment
6. Flag any issues (duplicates, typos, invalid equipment, uncommon equipment)

VALIDATION RULES:

**"approved"**: Real gym equipment, not a duplicate, clear identification
- Examples: "hex bar", "t-bar row machine", "glute-ham raise bench"

**"duplicate"**: Equipment already exists in taxonomy or user's custom list
- Check against both taxonomy IDs/labels AND user's custom equipment names
- Use fuzzy matching for synonyms (e.g., "pull-up bar" = "chin-up bar")

**"invalid"**: Not gym equipment, gibberish, or clearly wrong
- Examples: "banana", "asdf", "flying carpet", "xbox controller"

**"unclear"**: Ambiguous input that could mean multiple things or needs clarification
- Examples: "machine" (which machine?), "weights" (dumbbells? barbells?), "press" (chest? shoulder?)

OUTPUT FORMAT:
- **normalizedName**: Proper case, standard naming (e.g., "Smith Machine", "EZ Curl Bar")
- **rationale**: MAX 15 words, explain validation decision clearly
- **exampleExercises**: Array of 2-3 specific exercise names (lowercase)
- **warnings**: Optional array of warnings about the equipment
- **suggestions**: If invalid/unclear, suggest alternatives from taxonomy

EXAMPLES:

Input: "hex bar"
Output: {
  "validation": "approved",
  "normalizedName": "Hex Bar",
  "suggestedCategory": "free_weights",
  "rationale": "Valid deadlift bar variation, not in taxonomy",
  "isDuplicateOfExisting": null,
  "similarEquipment": ["trap_bar", "barbell"],
  "exampleExercises": ["hex bar deadlift", "hex bar shrugs", "hex bar rdl"],
  "warnings": ["Similar to Trap Bar - verify this is different"]
}

Input: "smith machine" (already exists as "smith_machine" in taxonomy)
Output: {
  "validation": "duplicate",
  "normalizedName": "Smith Machine",
  "suggestedCategory": "selectorized",
  "rationale": "Already exists in equipment taxonomy",
  "isDuplicateOfExisting": "smith_machine",
  "similarEquipment": ["smith_machine"],
  "exampleExercises": ["smith machine squat", "smith machine bench press"],
  "warnings": null
}

Input: "banana"
Output: {
  "validation": "invalid",
  "normalizedName": "Banana",
  "suggestedCategory": "other",
  "rationale": "Not gym equipment, invalid input",
  "isDuplicateOfExisting": null,
  "similarEquipment": [],
  "exampleExercises": [],
  "warnings": null,
  "suggestions": ["Try entering actual gym equipment like 'Dumbbells', 'Barbell', or 'Cable Machine'"]
}

Input: "machine"
Output: {
  "validation": "unclear",
  "normalizedName": "Machine",
  "suggestedCategory": "other",
  "rationale": "Too ambiguous, needs clarification which machine type",
  "isDuplicateOfExisting": null,
  "similarEquipment": [],
  "exampleExercises": [],
  "warnings": null,
  "suggestions": ["Chest Press Machine", "Leg Press Machine", "Cable Machine", "Smith Machine"]
}

Input: "concept2 rower"
Output: {
  "validation": "approved",
  "normalizedName": "Rowing Machine",
  "suggestedCategory": "specialty",
  "rationale": "Valid cardio equipment, normalized to generic name",
  "isDuplicateOfExisting": null,
  "similarEquipment": [],
  "exampleExercises": ["rowing machine intervals", "rowing machine steady state", "rowing machine sprints"],
  "warnings": ["Primarily cardio equipment, limited strength training use"]
}

IMPORTANT:
- Use fuzzy matching for duplicates (synonyms, brand names, variations)
- Normalize brand-specific names to generic (e.g., "Concept2 Rower" → "Rowing Machine")
- Be strict but helpful - suggest corrections for typos
- Provide actionable feedback in rationale and suggestions`
  }

  async validateEquipment(input: EquipmentValidationInput): Promise<EquipmentValidationResult> {
    // Build context about user's existing equipment
    const taxonomyEquipmentNames = Object.values(EQUIPMENT_TAXONOMY)
      .flatMap(category => category.items)
      .filter(eq => input.existingEquipment.includes(eq.id))
      .map(eq => `${eq.label} (id: ${eq.id})`)

    const customEquipmentNames = input.customEquipment?.map(eq => eq.name) || []

    const userPrompt = `
USER INPUT: "${input.equipmentName}"

USER'S EXISTING EQUIPMENT:
From Taxonomy: ${taxonomyEquipmentNames.join(', ') || 'None'}
Custom: ${customEquipmentNames.join(', ') || 'None'}

Validate this equipment name and return the result in JSON format.`

    return this.complete<EquipmentValidationResult>(userPrompt)
  }
}
