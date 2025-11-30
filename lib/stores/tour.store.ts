import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  hasSeenDashboardTour: boolean;
  hasSeenSimpleTour: boolean;
  hasSeenReviewTour: boolean;
  markDashboardTourAsSeen: () => void;
  markSimpleTourAsSeen: () => void;
  markReviewTourAsSeen: () => void;
  resetDashboardTour: () => void;
  resetSimpleTour: () => void;
  resetReviewTour: () => void;
  resetAllTours: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      hasSeenDashboardTour: false,
      hasSeenSimpleTour: false,
      hasSeenReviewTour: false,
      markDashboardTourAsSeen: () => set({ hasSeenDashboardTour: true }),
      markSimpleTourAsSeen: () => set({ hasSeenSimpleTour: true }),
      markReviewTourAsSeen: () => set({ hasSeenReviewTour: true }),
      resetDashboardTour: () => set({ hasSeenDashboardTour: false }),
      resetSimpleTour: () => set({ hasSeenSimpleTour: false }),
      resetReviewTour: () => set({ hasSeenReviewTour: false }),
      resetAllTours: () => set({ hasSeenDashboardTour: false, hasSeenSimpleTour: false, hasSeenReviewTour: false }),
    }),
    {
      name: "tour-storage",
      partialize: (state) => ({
        hasSeenDashboardTour: state.hasSeenDashboardTour,
        hasSeenSimpleTour: state.hasSeenSimpleTour,
        hasSeenReviewTour: state.hasSeenReviewTour,
      }),
    }
  )
);
