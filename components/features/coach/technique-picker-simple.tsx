"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  TechniqueType,
  TechniqueConfig,
  DropSetConfig,
  RestPauseConfig,
  MyoRepsConfig,
  ClusterSetConfig,
  PyramidConfig,
  TopSetBackoffConfig,
} from "@/lib/types/advanced-techniques";

interface TechniquePickerSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (technique: TechniqueType, config: TechniqueConfig) => void;
  exerciseType?: "compound" | "isolation";
}

// Simplified techniques for coach selection
const COACH_TECHNIQUES: {
  type: TechniqueType;
  forCompound?: boolean;
  forIsolation?: boolean;
}[] = [
  { type: "drop_set", forIsolation: true },
  { type: "rest_pause" },
  { type: "myo_reps", forIsolation: true },
  { type: "cluster_set", forCompound: true },
  { type: "pyramid" },
  { type: "top_set_backoff", forCompound: true },
];

export function TechniquePickerSimple({
  isOpen,
  onClose,
  onSelect,
  exerciseType = "isolation",
}: TechniquePickerSimpleProps) {
  const t = useTranslations("coach.techniques");
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueType | null>(null);

  // Configuration state for each technique
  const [dropSetConfig, setDropSetConfig] = useState<Omit<DropSetConfig, "type">>({
    drops: 2,
    dropPercentage: 20,
  });

  const [restPauseConfig, setRestPauseConfig] = useState<Omit<RestPauseConfig, "type">>({
    miniSets: 2,
    restSeconds: 15,
  });

  const [myoRepsConfig, setMyoRepsConfig] = useState<Omit<MyoRepsConfig, "type">>({
    activationReps: 15,
    miniSetReps: 5,
    miniSets: 4,
    restSeconds: 5,
  });

  const [clusterSetConfig, setClusterSetConfig] = useState<Omit<ClusterSetConfig, "type">>({
    repsPerCluster: 2,
    clusters: 5,
    intraRestSeconds: 20,
  });

  const [pyramidConfig, setPyramidConfig] = useState<Omit<PyramidConfig, "type">>({
    direction: "ascending",
    steps: 4,
  });

  const [topSetBackoffConfig, setTopSetBackoffConfig] = useState<Omit<TopSetBackoffConfig, "type">>({
    topSets: 1,
    topSetReps: 5,
    backoffSets: 2,
    backoffPercentage: 15,
    backoffReps: 8,
  });

  // Filter techniques based on exercise type
  const availableTechniques = COACH_TECHNIQUES.filter((tech) => {
    if (tech.forCompound && exerciseType !== "compound") return false;
    if (tech.forIsolation && exerciseType !== "isolation") return true; // Still show for all
    return true;
  });

  const handleConfirm = () => {
    if (!selectedTechnique) return;

    let config: TechniqueConfig;

    switch (selectedTechnique) {
      case "drop_set":
        config = { type: "drop_set", ...dropSetConfig };
        break;
      case "rest_pause":
        config = { type: "rest_pause", ...restPauseConfig };
        break;
      case "myo_reps":
        config = { type: "myo_reps", ...myoRepsConfig };
        break;
      case "cluster_set":
        config = { type: "cluster_set", ...clusterSetConfig };
        break;
      case "pyramid":
        config = { type: "pyramid", ...pyramidConfig };
        break;
      case "top_set_backoff":
        config = { type: "top_set_backoff", ...topSetBackoffConfig };
        break;
      default:
        return;
    }

    onSelect(selectedTechnique, config);
    onClose();
    setSelectedTechnique(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            {t("selectTechnique")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Technique Selection */}
          <div className="space-y-2">
            {availableTechniques.map(({ type }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedTechnique(type)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                  selectedTechnique === type
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t(`${type}.name`)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t(`${type}.description`)}
                  </div>
                </div>
                {selectedTechnique === type && (
                  <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Configuration for selected technique */}
          {selectedTechnique && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("configure")}
              </h4>

              {/* Drop Set Config */}
              {selectedTechnique === "drop_set" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureDrops")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={dropSetConfig.drops}
                      onChange={(e) =>
                        setDropSetConfig((prev) => ({
                          ...prev,
                          drops: Math.max(1, Math.min(4, parseInt(e.target.value) || 2)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configurePercentage")}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={10}
                        max={30}
                        value={dropSetConfig.dropPercentage}
                        onChange={(e) =>
                          setDropSetConfig((prev) => ({
                            ...prev,
                            dropPercentage: Math.max(10, Math.min(30, parseInt(e.target.value) || 20)),
                          }))
                        }
                        className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </>
              )}

              {/* Rest-Pause Config */}
              {selectedTechnique === "rest_pause" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureMiniSets")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={restPauseConfig.miniSets}
                      onChange={(e) =>
                        setRestPauseConfig((prev) => ({
                          ...prev,
                          miniSets: Math.max(1, Math.min(4, parseInt(e.target.value) || 2)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureRestSeconds")}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={5}
                        max={30}
                        value={restPauseConfig.restSeconds}
                        onChange={(e) =>
                          setRestPauseConfig((prev) => ({
                            ...prev,
                            restSeconds: Math.max(5, Math.min(30, parseInt(e.target.value) || 15)),
                          }))
                        }
                        className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                      />
                      <span className="text-sm text-gray-500">s</span>
                    </div>
                  </div>
                </>
              )}

              {/* Myo-Reps Config */}
              {selectedTechnique === "myo_reps" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureActivationReps")}
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={20}
                      value={myoRepsConfig.activationReps}
                      onChange={(e) =>
                        setMyoRepsConfig((prev) => ({
                          ...prev,
                          activationReps: Math.max(10, Math.min(20, parseInt(e.target.value) || 15)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureMiniSets")}
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={6}
                      value={myoRepsConfig.miniSets}
                      onChange={(e) =>
                        setMyoRepsConfig((prev) => ({
                          ...prev,
                          miniSets: Math.max(2, Math.min(6, parseInt(e.target.value) || 4)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                </>
              )}

              {/* Cluster Set Config */}
              {selectedTechnique === "cluster_set" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureClusters")}
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={8}
                      value={clusterSetConfig.clusters}
                      onChange={(e) =>
                        setClusterSetConfig((prev) => ({
                          ...prev,
                          clusters: Math.max(3, Math.min(8, parseInt(e.target.value) || 5)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureRepsPerCluster")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={clusterSetConfig.repsPerCluster}
                      onChange={(e) =>
                        setClusterSetConfig((prev) => ({
                          ...prev,
                          repsPerCluster: Math.max(1, Math.min(5, parseInt(e.target.value) || 2)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureRestSeconds")}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={10}
                        max={45}
                        value={clusterSetConfig.intraRestSeconds}
                        onChange={(e) =>
                          setClusterSetConfig((prev) => ({
                            ...prev,
                            intraRestSeconds: Math.max(10, Math.min(45, parseInt(e.target.value) || 20)),
                          }))
                        }
                        className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                      />
                      <span className="text-sm text-gray-500">s</span>
                    </div>
                  </div>
                </>
              )}

              {/* Pyramid Config */}
              {selectedTechnique === "pyramid" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureDirection")}
                    </label>
                    <select
                      value={pyramidConfig.direction}
                      onChange={(e) =>
                        setPyramidConfig((prev) => ({
                          ...prev,
                          direction: e.target.value as "ascending" | "descending" | "full",
                        }))
                      }
                      className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <option value="ascending">{t("pyramidAscending")}</option>
                      <option value="descending">{t("pyramidDescending")}</option>
                      <option value="full">{t("pyramidFull")}</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureSteps")}
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={6}
                      value={pyramidConfig.steps}
                      onChange={(e) =>
                        setPyramidConfig((prev) => ({
                          ...prev,
                          steps: Math.max(2, Math.min(6, parseInt(e.target.value) || 4)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                </>
              )}

              {/* Top Set + Backoff Config */}
              {selectedTechnique === "top_set_backoff" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureTopSetReps")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={topSetBackoffConfig.topSetReps}
                      onChange={(e) =>
                        setTopSetBackoffConfig((prev) => ({
                          ...prev,
                          topSetReps: Math.max(1, Math.min(8, parseInt(e.target.value) || 5)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configureBackoffSets")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={topSetBackoffConfig.backoffSets}
                      onChange={(e) =>
                        setTopSetBackoffConfig((prev) => ({
                          ...prev,
                          backoffSets: Math.max(1, Math.min(4, parseInt(e.target.value) || 2)),
                        }))
                      }
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      {t("configurePercentage")}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={10}
                        max={25}
                        value={topSetBackoffConfig.backoffPercentage}
                        onChange={(e) =>
                          setTopSetBackoffConfig((prev) => ({
                            ...prev,
                            backoffPercentage: Math.max(10, Math.min(25, parseInt(e.target.value) || 15)),
                          }))
                        }
                        className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedTechnique}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
              selectedTechnique
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            {t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
