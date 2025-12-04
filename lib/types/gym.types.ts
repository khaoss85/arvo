import { z } from "zod";

// ============================================
// Gym White-Label Types
// ============================================

// Subscription status
export const gymSubscriptionStatusSchema = z.enum(['trial', 'active', 'expired', 'cancelled']);
export type GymSubscriptionStatus = z.infer<typeof gymSubscriptionStatusSchema>;

// Subscription plan
export const gymSubscriptionPlanSchema = z.enum(['basic', 'professional', 'enterprise']);
export type GymSubscriptionPlan = z.infer<typeof gymSubscriptionPlanSchema>;

// Staff role within gym
export const gymStaffRoleSchema = z.enum(['coach', 'manager', 'admin']);
export type GymStaffRole = z.infer<typeof gymStaffRoleSchema>;

// Staff status
export const gymStaffStatusSchema = z.enum(['pending', 'active', 'suspended', 'terminated']);
export type GymStaffStatus = z.infer<typeof gymStaffStatusSchema>;

// Member status
export const gymMemberStatusSchema = z.enum(['pending', 'active', 'suspended', 'churned']);
export type GymMemberStatus = z.infer<typeof gymMemberStatusSchema>;

// Member registration source
export const gymMemberRegistrationSourceSchema = z.enum(['invite_code', 'slug_url', 'staff_invite', 'import']);
export type GymMemberRegistrationSource = z.infer<typeof gymMemberRegistrationSourceSchema>;

// Membership type
export const gymMembershipTypeSchema = z.enum(['trial', 'standard', 'premium', 'vip']);
export type GymMembershipType = z.infer<typeof gymMembershipTypeSchema>;

// Staff permissions
export const gymStaffPermissionsSchema = z.object({
  can_manage_members: z.boolean().default(true),
  can_create_templates: z.boolean().default(true),
  can_view_analytics: z.boolean().default(true),
  can_invite_staff: z.boolean().default(false),
  can_edit_branding: z.boolean().default(false),
});
export type GymStaffPermissions = z.infer<typeof gymStaffPermissionsSchema>;

// Gym address
export const gymAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
}).nullable();
export type GymAddress = z.infer<typeof gymAddressSchema>;

// Localized text (for i18n)
export const localizedTextSchema = z.object({
  en: z.string().optional(),
  it: z.string().optional(),
}).nullable();
export type LocalizedText = z.infer<typeof localizedTextSchema>;

// ============================================
// Gym Schema
// ============================================

export const gymSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1),
  description: z.string().nullable(),
  invite_code: z.string().length(6),
  subscription_status: gymSubscriptionStatusSchema,
  subscription_plan: gymSubscriptionPlanSchema.nullable(),
  max_staff: z.number().int().positive(),
  max_members: z.number().int().positive(),
  trial_ends_at: z.string().datetime().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  website: z.string().url().nullable(),
  address: gymAddressSchema,
  settings: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Gym = z.infer<typeof gymSchema>;

export const createGymSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

export type CreateGymInput = z.infer<typeof createGymSchema>;

export const updateGymSchema = createGymSchema.partial();
export type UpdateGymInput = z.infer<typeof updateGymSchema>;

// ============================================
// Gym Branding Schema
// ============================================

export const gymBrandingSchema = z.object({
  id: z.string().uuid(),
  gym_id: z.string().uuid(),

  // Visual Identity
  logo_url: z.string().url().nullable(),
  logo_dark_url: z.string().url().nullable(),
  favicon_url: z.string().url().nullable(),
  splash_image_url: z.string().url().nullable(),

  // Colors (HSL format: "h s% l%")
  primary_color: z.string().nullable(),
  secondary_color: z.string().nullable(),
  accent_color: z.string().nullable(),
  background_color: z.string().nullable(),
  text_color: z.string().nullable(),

  // Typography
  font_family: z.string().nullable(),
  font_heading: z.string().nullable(),

  // Custom Texts
  welcome_message: localizedTextSchema,
  tagline: localizedTextSchema,
  footer_text: localizedTextSchema,
  custom_texts: z.record(z.string(), localizedTextSchema).nullable(),

  // PWA / App Settings
  app_name: z.string().nullable(),
  short_name: z.string().nullable(),

  // Feature Toggles
  show_arvo_branding: z.boolean(),
  custom_domain: z.string().nullable(),

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type GymBranding = z.infer<typeof gymBrandingSchema>;

export const updateGymBrandingSchema = z.object({
  logo_url: z.string().url().nullable().optional(),
  logo_dark_url: z.string().url().nullable().optional(),
  favicon_url: z.string().url().nullable().optional(),
  splash_image_url: z.string().url().nullable().optional(),
  primary_color: z.string().nullable().optional(),
  secondary_color: z.string().nullable().optional(),
  accent_color: z.string().nullable().optional(),
  background_color: z.string().nullable().optional(),
  text_color: z.string().nullable().optional(),
  font_family: z.string().nullable().optional(),
  font_heading: z.string().nullable().optional(),
  welcome_message: localizedTextSchema.optional(),
  tagline: localizedTextSchema.optional(),
  footer_text: localizedTextSchema.optional(),
  custom_texts: z.record(z.string(), localizedTextSchema).nullable().optional(),
  app_name: z.string().nullable().optional(),
  short_name: z.string().nullable().optional(),
  show_arvo_branding: z.boolean().optional(),
});

export type UpdateGymBrandingInput = z.infer<typeof updateGymBrandingSchema>;

// ============================================
// Gym Staff Schema
// ============================================

export const gymStaffSchema = z.object({
  id: z.string().uuid(),
  gym_id: z.string().uuid(),
  user_id: z.string().uuid(),
  staff_role: gymStaffRoleSchema,
  status: gymStaffStatusSchema,
  permissions: gymStaffPermissionsSchema,
  invited_at: z.string().datetime().nullable(),
  invited_by: z.string().uuid().nullable(),
  accepted_at: z.string().datetime().nullable(),
  terminated_at: z.string().datetime().nullable(),
  termination_reason: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type GymStaff = z.infer<typeof gymStaffSchema>;

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  staff_role: gymStaffRoleSchema.default('coach'),
  permissions: gymStaffPermissionsSchema.optional(),
  notes: z.string().optional(),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const updateStaffSchema = z.object({
  staff_role: gymStaffRoleSchema.optional(),
  status: gymStaffStatusSchema.optional(),
  permissions: gymStaffPermissionsSchema.partial().optional(),
  notes: z.string().optional(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ============================================
// Gym Members Schema
// ============================================

export const gymMemberSchema = z.object({
  id: z.string().uuid(),
  gym_id: z.string().uuid(),
  user_id: z.string().uuid(),
  registration_source: gymMemberRegistrationSourceSchema,
  status: gymMemberStatusSchema,
  membership_type: gymMembershipTypeSchema,
  membership_expires_at: z.string().datetime().nullable(),
  assigned_coach_id: z.string().uuid().nullable(),
  registered_at: z.string().datetime().nullable(),
  last_active_at: z.string().datetime().nullable(),
  internal_notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type GymMember = z.infer<typeof gymMemberSchema>;

export const updateMemberSchema = z.object({
  status: gymMemberStatusSchema.optional(),
  membership_type: gymMembershipTypeSchema.optional(),
  membership_expires_at: z.string().datetime().nullable().optional(),
  assigned_coach_id: z.string().uuid().nullable().optional(),
  internal_notes: z.string().optional(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

// ============================================
// Gym Context (for UI)
// ============================================

export const gymContextSchema = z.object({
  gym_id: z.string().uuid(),
  gym_name: z.string(),
  gym_slug: z.string(),
  is_owner: z.boolean(),
  is_staff: z.boolean(),
  is_member: z.boolean(),
});

export type GymContext = z.infer<typeof gymContextSchema>;

// Extended gym with branding
export interface GymWithBranding extends Gym {
  branding: GymBranding | null;
}

// Gym stats for dashboard
export interface GymStats {
  total_members: number;
  active_members: number;
  total_staff: number;
  active_staff: number;
  members_this_month: number;
  workouts_this_month: number;
}

// Staff with user info (for listing)
export interface GymStaffWithUser extends GymStaff {
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

// Member with user info (for listing)
export interface GymMemberWithUser extends GymMember {
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  coach?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}
