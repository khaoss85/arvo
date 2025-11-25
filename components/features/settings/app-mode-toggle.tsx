"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAppMode } from "@/lib/hooks/useAppMode";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface AppModeToggleProps {
  className?: string;
}

export function AppModeToggle({ className }: AppModeToggleProps) {
  const t = useTranslations("simpleMode.settings");
  const { mode, isLoading, switchToMode } = useAppMode();
  const router = useRouter();

  const modes = [
    {
      id: "simple" as const,
      name: t("simpleMode"),
      description: t("simpleModeDescription"),
      icon: Zap,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500",
    },
    {
      id: "advanced" as const,
      name: t("advancedMode"),
      description: t("advancedModeDescription"),
      icon: Sparkles,
      color: "text-primary-500",
      bgColor: "bg-primary-500/10",
      borderColor: "border-primary-500",
    },
  ];

  const handleModeSelect = async (newMode: "simple" | "advanced") => {
    if (newMode === mode) return;

    await switchToMode(newMode);

    // Redirect to appropriate dashboard after mode switch
    if (newMode === "simple") {
      router.push("/simple");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {modes.map((modeOption) => {
        const isSelected = mode === modeOption.id;
        const Icon = modeOption.icon;

        return (
          <motion.div
            key={modeOption.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card
              onClick={() => handleModeSelect(modeOption.id)}
              className={cn(
                "relative cursor-pointer p-4 transition-all",
                "border-2",
                isSelected
                  ? cn(modeOption.borderColor, modeOption.bgColor)
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-700",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    modeOption.bgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", modeOption.color)} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {modeOption.name}
                    </h3>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full",
                          modeOption.bgColor
                        )}
                      >
                        <Check className={cn("h-4 w-4", modeOption.color)} />
                      </motion.div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {modeOption.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
