import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  hasSeenDashboardTour: boolean;
  hasSeenSimpleTour: boolean;
  markDashboardTourAsSeen: () => void;
  markSimpleTourAsSeen: () => void;
  resetDashboardTour: () => void;
  resetSimpleTour: () => void;
  resetAllTours: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      hasSeenDashboardTour: false,
      hasSeenSimpleTour: false,
      markDashboardTourAsSeen: () => set({ hasSeenDashboardTour: true }),
      markSimpleTourAsSeen: () => set({ hasSeenSimpleTour: true }),
      resetDashboardTour: () => set({ hasSeenDashboardTour: false }),
      resetSimpleTour: () => set({ hasSeenSimpleTour: false }),
      resetAllTours: () => set({ hasSeenDashboardTour: false, hasSeenSimpleTour: false }),
    }),
    {
      name: "tour-storage",
      partialize: (state) => ({
        hasSeenDashboardTour: state.hasSeenDashboardTour,
        hasSeenSimpleTour: state.hasSeenSimpleTour,
      }),
    }
  )
);
