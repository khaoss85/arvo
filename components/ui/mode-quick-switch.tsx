"use client";

import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAppMode } from "@/lib/hooks/useAppMode";
import { ModeSelectionDrawer } from "./mode-selection-drawer";

interface ModeQuickSwitchProps {
  className?: string;
}

export function ModeQuickSwitch({ className }: ModeQuickSwitchProps) {
  const t = useTranslations("simpleMode.settings");
  const { mode, isLoading } = useAppMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Get current mode info
  const currentModeInfo = {
    simple: {
      icon: Zap,
      color: "text-green-500",
      name: t("trainingMode"),
    },
    advanced: {
      icon: Sparkles,
      color: "text-primary-500",
      name: t("advancedMode"),
    },
    coach: {
      icon: Users,
      color: "text-orange-500",
      name: t("coachMode"),
    },
  }[mode] || {
    icon: Sparkles,
    color: "text-primary-500",
    name: t("advancedMode"),
  };

  const CurrentIcon = currentModeInfo.icon;

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        disabled={isLoading}
        className={cn(
          "relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
          "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        aria-label={t("changeMode")}
      >
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          <CurrentIcon className={cn("h-4 w-4", currentModeInfo.color)} />
          <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">
            {currentModeInfo.name}
          </span>
          <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
        </motion.div>
      </button>

      <ModeSelectionDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
