import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Toast notifications
  toasts: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>;

  // Mobile navigation
  isMobileMenuOpen: boolean;

  // Actions
  addToast: (
    message: string,
    type?: "success" | "error" | "info" | "warning"
  ) => void;
  removeToast: (id: string) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      toasts: [],
      isMobileMenuOpen: false,

      addToast: (message, type = "info") =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              id: Math.random().toString(36).substring(7),
              message,
              type,
            },
          ],
        })),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      toggleMobileMenu: () =>
        set((state) => ({
          isMobileMenuOpen: !state.isMobileMenuOpen,
        })),

      closeMobileMenu: () =>
        set({
          isMobileMenuOpen: false,
        }),
    }),
    {
      name: "ui-storage",
      partialize: (_state) => ({
        // Don't persist toasts or mobile menu state
      }),
    }
  )
);
