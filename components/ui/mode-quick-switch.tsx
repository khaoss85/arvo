"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAppMode } from "@/lib/hooks/useAppMode";

interface ModeQuickSwitchProps {
  className?: string;
}

export function ModeQuickSwitch({ className }: ModeQuickSwitchProps) {
  const { mode, isLoading, switchToMode } = useAppMode();

  const handleSwitch = async () => {
    const newMode = mode === "simple" ? "advanced" : "simple";
    await switchToMode(newMode);

    // Redirect to appropriate dashboard after mode switch
    if (newMode === "simple") {
      window.location.href = "/simple";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <button
      onClick={handleSwitch}
      disabled={isLoading}
      className={cn(
        "relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
        "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      aria-label={`Switch to ${mode === "simple" ? "advanced" : "simple"} mode`}
    >
      <motion.div
        key={mode}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2"
      >
        {mode === "simple" ? (
          <>
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-gray-700 dark:text-gray-300">Simple</span>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <Sparkles className="h-4 w-4 text-primary-500" />
            <span className="text-gray-500 dark:text-gray-400">Pro</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-primary-500" />
            <span className="text-gray-700 dark:text-gray-300">Pro</span>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-gray-500 dark:text-gray-400">Simple</span>
          </>
        )}
      </motion.div>
    </button>
  );
}
