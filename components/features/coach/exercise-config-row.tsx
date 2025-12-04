"use client";

import { useTranslations } from "next-intl";
import { GripVertical, Trash2, PlayCircle, Zap, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ExerciseDBExercise } from "@/lib/services/exercisedb.service";
import type { TechniqueType, TechniqueConfig } from "@/lib/types/advanced-techniques";

export interface ExerciseConfig {
  id: string;
  exercise: ExerciseDBExercise;
  sets: number;
  reps: string; // Can be "8-12" or "10"
  weight: number | null;
  rir: number | null;
  restSeconds: number; // Rest time between sets in seconds
  notes: string;
  // Optional technique
  technique?: {
    type: TechniqueType;
    config: TechniqueConfig;
  };
}

interface ExerciseConfigRowProps {
  config: ExerciseConfig;
  index: number;
  onChange: (id: string, updates: Partial<ExerciseConfig>) => void;
  onRemove: (id: string) => void;
  onShowAnimation?: (exercise: ExerciseDBExercise) => void;
  onAddTechnique?: (exerciseId: string) => void;
  onGenerateNotes?: (exerciseId: string) => void;
  showTechniqueButton?: boolean;
  isGeneratingNotes?: boolean;
}

// Map technique types to display names
const TECHNIQUE_DISPLAY_NAMES: Record<TechniqueType, string> = {
  drop_set: "Drop Set",
  rest_pause: "Rest-Pause",
  superset: "Superset",
  top_set_backoff: "Top Set + Backoff",
  myo_reps: "Myo-Reps",
  giant_set: "Giant Set",
  cluster_set: "Cluster Set",
  pyramid: "Pyramid",
  fst7_protocol: "FST-7",
  loaded_stretching: "Loaded Stretch",
  mechanical_drop_set: "Mechanical Drop",
  lengthened_partials: "Lengthened Partials",
  forced_reps: "Forced Reps",
  pre_exhaust: "Pre-Exhaust",
};

export function ExerciseConfigRow({
  config,
  index,
  onChange,
  onRemove,
  onShowAnimation,
  onAddTechnique,
  onGenerateNotes,
  showTechniqueButton = false,
  isGeneratingNotes = false,
}: ExerciseConfigRowProps) {
  const t = useTranslations("coach.customBuilder");
  const tTech = useTranslations("coach.techniques");

  const handleNumberChange = (
    field: "sets" | "weight" | "rir" | "restSeconds",
    value: string
  ) => {
    const num = parseInt(value, 10);
    if (field === "sets") {
      onChange(config.id, { sets: isNaN(num) ? 1 : Math.max(1, Math.min(10, num)) });
    } else if (field === "weight") {
      onChange(config.id, { weight: isNaN(num) ? null : Math.max(0, num) });
    } else if (field === "rir") {
      onChange(config.id, { rir: isNaN(num) ? null : Math.max(0, Math.min(5, num)) });
    } else if (field === "restSeconds") {
      onChange(config.id, { restSeconds: isNaN(num) ? 120 : Math.max(30, Math.min(300, num)) });
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      {/* Header Row */}
      <div className="flex items-start gap-3 mb-3">
        {/* Drag Handle */}
        <div className="flex-shrink-0 mt-1 cursor-grab">
          <GripVertical className="w-5 h-5 text-gray-500" />
        </div>

        {/* Exercise Number */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{index + 1}</span>
        </div>

        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {config.exercise.gifUrl && onShowAnimation && (
              <button
                type="button"
                onClick={() => onShowAnimation(config.exercise)}
                className="p-0.5 hover:bg-gray-700 rounded transition-colors"
                title={t("viewAnimation")}
              >
                <PlayCircle className="w-4 h-4 text-gray-500 hover:text-orange-400" />
              </button>
            )}
            <h3 className="font-medium text-white truncate capitalize">
              {config.exercise.name}
            </h3>
          </div>
          <div className="flex gap-2 mt-1 text-xs text-gray-400">
            <span className="px-1.5 py-0.5 bg-gray-700 rounded capitalize">
              {config.exercise.target}
            </span>
            <span className="px-1.5 py-0.5 bg-gray-700 rounded capitalize">
              {config.exercise.equipment}
            </span>
          </div>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(config.id)}
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title={t("removeExercise")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Config Grid */}
      <div className="grid grid-cols-5 gap-2">
        {/* Sets */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("sets")}</label>
          <input
            type="number"
            min={1}
            max={10}
            value={config.sets}
            onChange={(e) => handleNumberChange("sets", e.target.value)}
            className={cn(
              "w-full px-2 py-2 text-sm rounded-lg border bg-gray-900 text-white",
              "border-gray-600 focus:border-orange-500 focus:outline-none"
            )}
          />
        </div>

        {/* Reps */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("reps")}</label>
          <input
            type="text"
            value={config.reps}
            onChange={(e) => onChange(config.id, { reps: e.target.value })}
            placeholder="8-12"
            className={cn(
              "w-full px-2 py-2 text-sm rounded-lg border bg-gray-900 text-white placeholder-gray-500",
              "border-gray-600 focus:border-orange-500 focus:outline-none"
            )}
          />
        </div>

        {/* Weight */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("weight")}</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={config.weight ?? ""}
              onChange={(e) => handleNumberChange("weight", e.target.value)}
              placeholder="—"
              className={cn(
                "w-full px-2 py-2 text-sm rounded-lg border bg-gray-900 text-white placeholder-gray-500",
                "border-gray-600 focus:border-orange-500 focus:outline-none pr-7"
              )}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              kg
            </span>
          </div>
        </div>

        {/* RIR */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("rir")}</label>
          <input
            type="number"
            min={0}
            max={5}
            value={config.rir ?? ""}
            onChange={(e) => handleNumberChange("rir", e.target.value)}
            placeholder="—"
            className={cn(
              "w-full px-2 py-2 text-sm rounded-lg border bg-gray-900 text-white placeholder-gray-500",
              "border-gray-600 focus:border-orange-500 focus:outline-none"
            )}
          />
        </div>

        {/* Rest */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("rest")}</label>
          <div className="relative">
            <input
              type="number"
              min={30}
              max={300}
              step={15}
              value={config.restSeconds}
              onChange={(e) => handleNumberChange("restSeconds", e.target.value)}
              className={cn(
                "w-full px-2 py-2 text-sm rounded-lg border bg-gray-900 text-white",
                "border-gray-600 focus:border-orange-500 focus:outline-none pr-5"
              )}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              s
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={config.notes}
          onChange={(e) => onChange(config.id, { notes: e.target.value })}
          placeholder={t("notesPlaceholder")}
          className={cn(
            "flex-1 px-3 py-2 text-sm rounded-lg border bg-gray-900 text-white placeholder-gray-500",
            "border-gray-600 focus:border-orange-500 focus:outline-none"
          )}
        />
        {onGenerateNotes && (
          <button
            type="button"
            onClick={() => onGenerateNotes(config.id)}
            disabled={isGeneratingNotes}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              "border-gray-600 hover:border-orange-500 hover:bg-orange-500/10",
              "text-gray-400 hover:text-orange-400",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title={t("generateNotes")}
          >
            {isGeneratingNotes ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Technique Section */}
      {showTechniqueButton && (
        <div className="mt-3">
          {config.technique ? (
            // Show applied technique
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="text-sm text-orange-400 font-medium">
                {TECHNIQUE_DISPLAY_NAMES[config.technique.type]}
              </span>
              <button
                type="button"
                onClick={() => onChange(config.id, { technique: undefined })}
                className="ml-auto p-1 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 rounded transition-colors"
                title={tTech("removeTechnique")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // Show add technique button
            <button
              type="button"
              onClick={() => onAddTechnique?.(config.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-orange-400 border border-dashed border-gray-600 hover:border-orange-500/50 rounded-lg transition-colors w-full"
            >
              <Zap className="w-4 h-4" />
              <span>{tTech("addTechnique")}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
