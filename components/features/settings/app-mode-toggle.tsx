"use client";

import * as React from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, Check, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAppMode } from "@/lib/hooks/useAppMode";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import type { AppMode } from "@/lib/stores/app-mode.store";

interface AppModeToggleProps {
  className?: string;
}

export function AppModeToggle({ className }: AppModeToggleProps) {
  const t = useTranslations("simpleMode.settings");
  const { mode, isLoading, switchToMode } = useAppMode();
  const { canAccessCoachMode, canAccessGymAdminMode, isLoading: isRoleLoading } = useUserRole();
  const router = useRouter();

  const modes = useMemo(() => [
    {
      id: "simple" as const,
      name: t("trainingMode"),
      description: t("trainingModeDescription"),
      icon: Zap,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500",
      disabled: false,
    },
    {
      id: "advanced" as const,
      name: t("advancedMode"),
      description: t("advancedModeDescription"),
      icon: Sparkles,
      color: "text-primary-500",
      bgColor: "bg-primary-500/10",
      borderColor: "border-primary-500",
      disabled: false,
    },
    {
      id: "coach" as const,
      name: t("coachMode"),
      description: t("coachModeDescription"),
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500",
      disabled: !canAccessCoachMode,
      badge: canAccessCoachMode ? undefined : t("comingSoon"),
    },
    {
      id: "gym-admin" as const,
      name: t("gymAdminMode"),
      description: t("gymAdminModeDescription"),
      icon: Building2,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500",
      disabled: !canAccessGymAdminMode,
      badge: canAccessGymAdminMode ? undefined : t("comingSoon"),
      isExternal: true,
    },
  ], [t, canAccessCoachMode, canAccessGymAdminMode]);

  const handleModeSelect = async (newMode: AppMode | "gym-admin") => {
    // Gym admin is a separate section, not a mode switch
    if (newMode === "gym-admin") {
      router.push("/gym-admin");
      return;
    }

    if (newMode === mode) return;

    await switchToMode(newMode);

    // Redirect to appropriate dashboard after mode switch
    if (newMode === "simple") {
      router.push("/simple");
    } else if (newMode === "coach") {
      router.push("/coach");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {modes.map((modeOption) => {
        const isSelected = mode === modeOption.id;
        const Icon = modeOption.icon;
        const isDisabled = modeOption.disabled;

        return (
          <motion.div
            key={modeOption.id}
            whileHover={!isDisabled ? { scale: 1.01 } : undefined}
            whileTap={!isDisabled ? { scale: 0.99 } : undefined}
          >
            <Card
              onClick={() => !isDisabled && !isLoading && !isRoleLoading && handleModeSelect(modeOption.id)}
              className={cn(
                "relative p-4 transition-all",
                "border-2",
                isDisabled
                  ? "opacity-60 cursor-not-allowed border-transparent"
                  : "cursor-pointer",
                !isDisabled && isSelected
                  ? cn(modeOption.borderColor, modeOption.bgColor)
                  : !isDisabled && "border-transparent hover:border-gray-200 dark:hover:border-gray-700",
                (isLoading || isRoleLoading) && "opacity-50 cursor-not-allowed"
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {modeOption.name}
                      </h3>
                      {modeOption.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {modeOption.badge}
                        </span>
                      )}
                    </div>
                    {isSelected && !isDisabled && (
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
