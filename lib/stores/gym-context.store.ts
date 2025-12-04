import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GymContext, GymBranding } from "@/lib/types/gym.types";
import { GymService } from "@/lib/services/gym.service";

interface GymContextState {
  // User's gym membership context
  gymId: string | null;
  gymSlug: string | null;
  gymName: string | null;
  isOwner: boolean;
  isStaff: boolean;
  isMember: boolean;

  // Branding data
  branding: GymBranding | null;

  // Loading state
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: (userId: string) => Promise<void>;
  setBranding: (branding: GymBranding | null) => void;
  clear: () => void;

  // Hydration tracking
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useGymContextStore = create<GymContextState>()(
  persist(
    (set, get) => ({
      // Initial state
      gymId: null,
      gymSlug: null,
      gymName: null,
      isOwner: false,
      isStaff: false,
      isMember: false,
      branding: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      initialize: async (userId: string) => {
        // Don't re-initialize if already loading
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
          // Get user's gym context
          const context = await GymService.getUserGymContext(userId);

          if (!context) {
            // User is not associated with any gym
            set({
              gymId: null,
              gymSlug: null,
              gymName: null,
              isOwner: false,
              isStaff: false,
              isMember: false,
              branding: null,
              isLoading: false,
              isInitialized: true,
            });
            return;
          }

          // Get branding if user has a gym
          const branding = await GymService.getBranding(context.gym_id);

          set({
            gymId: context.gym_id,
            gymSlug: context.gym_slug,
            gymName: context.gym_name,
            isOwner: context.is_owner,
            isStaff: context.is_staff,
            isMember: context.is_member,
            branding,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error("[GymContextStore] Failed to initialize:", error);
          set({
            isLoading: false,
            isInitialized: true,
            error: error instanceof Error ? error.message : "Failed to load gym context",
          });
        }
      },

      setBranding: (branding) => set({ branding }),

      clear: () =>
        set({
          gymId: null,
          gymSlug: null,
          gymName: null,
          isOwner: false,
          isStaff: false,
          isMember: false,
          branding: null,
          isLoading: false,
          isInitialized: false,
          error: null,
        }),
    }),
    {
      name: "gym-context-storage",
      // Only persist essential data, not loading states
      partialize: (state) => ({
        gymId: state.gymId,
        gymSlug: state.gymSlug,
        gymName: state.gymName,
        isOwner: state.isOwner,
        isStaff: state.isStaff,
        isMember: state.isMember,
        branding: state.branding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Helper hook to check if user belongs to a gym
export function useHasGym(): boolean {
  const { gymId, isInitialized } = useGymContextStore();
  return isInitialized && gymId !== null;
}

// Helper hook to get gym role
export function useGymRole(): "owner" | "staff" | "member" | null {
  const { isOwner, isStaff, isMember, isInitialized } = useGymContextStore();
  if (!isInitialized) return null;
  if (isOwner) return "owner";
  if (isStaff) return "staff";
  if (isMember) return "member";
  return null;
}
