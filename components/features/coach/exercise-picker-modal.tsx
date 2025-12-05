"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Search, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MuscleWikiService, type LegacyExercise } from "@/lib/services/musclewiki.service";

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: LegacyExercise) => void;
  excludeExercises?: string[]; // Exercise names already in workout
}

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  excludeExercises = [],
}: ExercisePickerModalProps) {
  const t = useTranslations("coach.customBuilder");

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<LegacyExercise[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter state
  const [filterOptions, setFilterOptions] = useState<{ bodyParts: string[]; equipments: string[] }>({
    bodyParts: [],
    equipments: [],
  });
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
      setSelectedBodyParts([]);
      setSelectedEquipments([]);
    }
  }, [isOpen]);

  // Load filter options
  useEffect(() => {
    if (isOpen && !filtersLoaded) {
      MuscleWikiService.getFilterOptions().then((options) => {
        setFilterOptions(options);
        setFiltersLoaded(true);
      });
    }
  }, [isOpen, filtersLoaded]);

  // Search with debounce
  useEffect(() => {
    if (!isOpen) return;

    const hasFilters = selectedBodyParts.length > 0 || selectedEquipments.length > 0;

    if (searchQuery.length < 2 && !hasFilters) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const searchResults = await MuscleWikiService.searchExercisesLegacy(
          searchQuery,
          30,
          {
            bodyParts: selectedBodyParts.length > 0 ? selectedBodyParts : undefined,
            equipments: selectedEquipments.length > 0 ? selectedEquipments : undefined,
          }
        );

        // Filter out exercises already in workout
        const excludeLower = excludeExercises.map((e) => e.toLowerCase());
        const filtered = searchResults.filter(
          (ex) => !excludeLower.includes(ex.name.toLowerCase())
        );

        setResults(filtered);
      } catch (err) {
        console.error("[ExercisePickerModal] Search error:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedBodyParts, selectedEquipments, isOpen, excludeExercises]);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (exercise: LegacyExercise) => {
    onSelect(exercise);
    onClose();
  };

  const toggleBodyPart = (bp: string) => {
    setSelectedBodyParts((prev) =>
      prev.includes(bp) ? prev.filter((x) => x !== bp) : [...prev, bp]
    );
  };

  const toggleEquipment = (eq: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">{t("picker.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("picker.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Filters */}
        {filtersLoaded && (
          <div className="px-4 py-3 border-b border-gray-800 space-y-3">
            {/* Body Parts */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5">{t("picker.muscleGroup")}</p>
              <div className="flex gap-1.5 flex-wrap">
                {filterOptions.bodyParts.map((bp) => (
                  <button
                    key={bp}
                    onClick={() => toggleBodyPart(bp)}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-full border transition-all",
                      selectedBodyParts.includes(bp)
                        ? "bg-orange-600 border-orange-500 text-white"
                        : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500"
                    )}
                  >
                    {bp}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5">{t("picker.equipment")}</p>
              <div className="flex gap-1.5 flex-wrap">
                {filterOptions.equipments.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-full border transition-all",
                      selectedEquipments.includes(eq)
                        ? "bg-orange-600 border-orange-500 text-white"
                        : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500"
                    )}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchQuery.length < 2 && selectedBodyParts.length === 0 && selectedEquipments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">{t("picker.hint")}</p>
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">{t("picker.noResults")}</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {results.map((exercise, idx) => (
                <button
                  key={exercise.id || `ex-${idx}`}
                  onClick={() => handleSelect(exercise)}
                  className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 hover:border-orange-500 transition-all text-left"
                >
                  {exercise.gifUrl && (
                    <img
                      src={exercise.gifUrl}
                      alt={exercise.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0 bg-gray-700"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate capitalize">
                      {exercise.name}
                    </h3>
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-700 rounded capitalize">
                        {exercise.target}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-700 rounded capitalize">
                        {exercise.equipment}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            {t("picker.footer", { count: results.length })}
          </p>
        </div>
      </div>
    </div>
  );
}
