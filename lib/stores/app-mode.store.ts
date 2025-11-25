import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppMode = "simple" | "advanced";

interface AppModeState {
  mode: AppMode;
  isLoading: boolean;
  setMode: (mode: AppMode) => void;
  setLoading: (loading: boolean) => void;
  syncFromServer: (mode: AppMode) => void;
}

export const useAppModeStore = create<AppModeState>()(
  persist(
    (set) => ({
      mode: "advanced",
      isLoading: false,
      setMode: (mode) => set({ mode }),
      setLoading: (loading) => set({ isLoading: loading }),
      syncFromServer: (mode) => set({ mode, isLoading: false }),
    }),
    {
      name: "app-mode-storage",
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
