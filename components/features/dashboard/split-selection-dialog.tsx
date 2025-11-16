"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Dumbbell } from "lucide-react";
import type { SplitPlan } from "@/lib/types/schemas";

interface SplitSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  splits: SplitPlan[];
  currentSplitId?: string | null;
  onSelect: (splitId: string) => void;
}

export function SplitSelectionDialog({
  open,
  onOpenChange,
  splits,
  currentSplitId,
  onSelect,
}: SplitSelectionDialogProps) {
  const t = useTranslations("Dashboard.SplitSelection");

  const formatSplitType = (splitType: string) => {
    return splitType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {splits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noSplits")}
            </div>
          ) : (
            splits.map((split) => {
              const isCurrent = split.id === currentSplitId;

              return (
                <button
                  key={split.id}
                  onClick={() => !isCurrent && onSelect(split.id)}
                  disabled={isCurrent}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-lg">
                          {formatSplitType(split.split_type)}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded-full">
                            {t("current")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {t("cycleDays", { days: split.cycle_days })}
                          </span>
                        </div>

                        {split.specialization_muscle && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-purple-600">
                              Focus: {split.specialization_muscle}
                            </span>
                          </div>
                        )}
                      </div>

                      {split.created_at && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {t("created", {
                            date: new Date(
                              split.created_at
                            ).toLocaleDateString(),
                          })}
                        </div>
                      )}
                    </div>

                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(split.id);
                        }}
                      >
                        {t("select")}
                      </Button>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
