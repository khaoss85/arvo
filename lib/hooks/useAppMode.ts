"use client";

import { useCallback } from "react";
import { useAppModeStore, type AppMode } from "@/lib/stores/app-mode.store";
import { updateAppModeAction } from "@/app/actions/user-actions";

export function useAppMode() {
  const { mode, isLoading, setMode, setLoading, syncFromServer } = useAppModeStore();

  const toggleMode = useCallback(async () => {
    const newMode: AppMode = mode === "simple" ? "advanced" : "simple";
    setLoading(true);

    try {
      const result = await updateAppModeAction(newMode);
      if (result.success) {
        setMode(newMode);
      }
    } catch (error) {
      console.error("Failed to update app mode:", error);
    } finally {
      setLoading(false);
    }
  }, [mode, setMode, setLoading]);

  const switchToMode = useCallback(async (newMode: AppMode) => {
    if (newMode === mode) return;

    setLoading(true);

    try {
      // For coach mode, promote user to coach role and create profile if needed
      if (newMode === "coach") {
        await fetch("/api/user/promote-to-coach", { method: "POST" });
        setMode(newMode);
      } else {
        const result = await updateAppModeAction(newMode);
        if (result.success) {
          setMode(newMode);
        }
      }
    } catch (error) {
      console.error("Failed to update app mode:", error);
    } finally {
      setLoading(false);
    }
  }, [mode, setMode, setLoading]);

  return {
    mode,
    isSimpleMode: mode === "simple",
    isAdvancedMode: mode === "advanced",
    isCoachMode: mode === "coach",
    isLoading,
    toggleMode,
    switchToMode,
    syncFromServer,
  };
}
