"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, Check, Users, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAppMode } from "@/lib/hooks/useAppMode";
import { useRouter } from "next/navigation";

interface ModeSelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModeSelectionDrawer({ open, onOpenChange }: ModeSelectionDrawerProps) {
  const t = useTranslations("simpleMode.settings");
  const { mode, isLoading, switchToMode } = useAppMode();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Needed for Portal - document.body doesn't exist during SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  const modes = [
    {
      id: "simple" as const,
      name: t("trainingMode"),
      description: t("trainingModeDescription"),
      icon: Zap,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      disabled: false,
    },
    {
      id: "advanced" as const,
      name: t("advancedMode"),
      description: t("advancedModeDescription"),
      icon: Sparkles,
      color: "text-primary-500",
      bgColor: "bg-primary-500/10",
      disabled: false,
    },
    {
      id: "coach" as const,
      name: t("coachMode"),
      description: t("coachModeDescription"),
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      disabled: true,
      badge: t("comingSoon"),
    },
  ];

  const handleModeSelect = async (newMode: "simple" | "advanced") => {
    if (newMode === mode) {
      onOpenChange(false);
      return;
    }

    await switchToMode(newMode);
    onOpenChange(false);

    // Redirect to appropriate dashboard after mode switch
    if (newMode === "simple") {
      router.push("/simple");
    } else {
      router.push("/dashboard");
    }
  };

  // Don't render on server
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/60"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-lg font-semibold">{t("selectMode")}</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Mode Options */}
            <div className="px-4 pb-8 space-y-3 overflow-y-auto max-h-[calc(85vh-100px)]">
              {modes.map((modeOption) => {
                const isSelected = mode === modeOption.id;
                const Icon = modeOption.icon;
                const isDisabled = modeOption.disabled;

                return (
                  <motion.button
                    key={modeOption.id}
                    onClick={() => !isDisabled && handleModeSelect(modeOption.id as "simple" | "advanced")}
                    disabled={isDisabled || isLoading}
                    whileTap={!isDisabled ? { scale: 0.98 } : undefined}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all",
                      "border-2",
                      isDisabled
                        ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0",
                        modeOption.bgColor
                      )}
                    >
                      <Icon className={cn("h-5 w-5", modeOption.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {modeOption.name}
                        </span>
                        {modeOption.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            {modeOption.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {modeOption.description}
                      </p>
                    </div>

                    {isSelected && !isDisabled && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary flex-shrink-0"
                      >
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Safe area for iOS */}
            <div className="h-safe" />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
