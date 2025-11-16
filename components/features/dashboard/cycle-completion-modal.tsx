"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Award, Dumbbell, Brain, Calendar } from "lucide-react";

interface CycleCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleNumber: number;
  splitPlanName: string;
  stats: {
    totalVolume: number;
    totalWorkouts: number;
    avgMentalReadiness: number | null;
    totalSets: number;
  };
  comparison?: {
    volumeDelta: number; // Percentage
    workoutsDelta: number;
    mentalReadinessDelta: number | null;
    setsDelta: number;
  } | null;
  onContinue: () => void;
  onChangeSplit: () => void;
}

export function CycleCompletionModal({
  open,
  onOpenChange,
  cycleNumber,
  splitPlanName,
  stats,
  comparison,
  onContinue,
  onChangeSplit,
}: CycleCompletionModalProps) {
  const t = useTranslations("Dashboard.CycleCompletion");

  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat("it-IT", {
      maximumFractionDigits: 0,
    }).format(volume);
  };

  const formatMentalReadiness = (mr: number | null) => {
    if (mr === null) return "N/A";
    return mr.toFixed(1);
  };

  const renderTrendIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (delta < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const renderDelta = (delta: number, isPercentage: boolean = false) => {
    const sign = delta > 0 ? "+" : "";
    const value = isPercentage ? `${sign}${delta.toFixed(1)}%` : `${sign}${delta}`;
    const colorClass = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-500";

    return <span className={`text-sm font-medium ${colorClass}`}>{value}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Award className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {t("title", { cycleNumber })}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("subtitle", { splitName: splitPlanName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Volume */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("stats.totalVolume")}
                </span>
              </div>
              <div className="text-2xl font-bold">{formatVolume(stats.totalVolume)} kg</div>
              {comparison && (
                <div className="flex items-center gap-1 mt-1">
                  {renderTrendIcon(comparison.volumeDelta)}
                  {renderDelta(comparison.volumeDelta, true)}
                </div>
              )}
            </div>

            {/* Total Workouts */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("stats.workouts")}
                </span>
              </div>
              <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
              {comparison && comparison.workoutsDelta !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {renderTrendIcon(comparison.workoutsDelta)}
                  {renderDelta(comparison.workoutsDelta)}
                </div>
              )}
            </div>

            {/* Mental Readiness */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("stats.mentalReadiness")}
                </span>
              </div>
              <div className="text-2xl font-bold">{formatMentalReadiness(stats.avgMentalReadiness)}</div>
              {comparison && comparison.mentalReadinessDelta !== null && comparison.mentalReadinessDelta !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {renderTrendIcon(comparison.mentalReadinessDelta)}
                  {renderDelta(comparison.mentalReadinessDelta)}
                </div>
              )}
            </div>

            {/* Total Sets */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("stats.totalSets")}
                </span>
              </div>
              <div className="text-2xl font-bold">{stats.totalSets}</div>
              {comparison && comparison.setsDelta !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {renderTrendIcon(comparison.setsDelta)}
                  {renderDelta(comparison.setsDelta)}
                </div>
              )}
            </div>
          </div>

          {/* Comparison Note */}
          {comparison && (
            <div className="text-center text-sm text-muted-foreground">
              {t("comparisonNote")}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onChangeSplit}
            className="flex-1"
          >
            {t("actions.changeSplit")}
          </Button>
          <Button
            onClick={onContinue}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {t("actions.continue", { splitName: splitPlanName })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
