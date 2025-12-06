"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, Check, Loader2, X, User, RotateCcw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CoachCodeInputProps {
  userId: string;
  currentCoachId: string | null;
  currentCoachName?: string | null;
}

interface ArchivedSplitInfo {
  id: string;
  splitType: string;
  archivedAt: string;
}

interface CoachInfo {
  coachBio: string | null;
  autonomyLevel: "minimal" | "standard" | "full";
}

export function CoachCodeInput({
  userId,
  currentCoachId,
  currentCoachName,
}: CoachCodeInputProps) {
  const t = useTranslations("settings.coachCode");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [linkedCoachName, setLinkedCoachName] = useState<string | null>(
    currentCoachName || null
  );
  const [isLinked, setIsLinked] = useState(!!currentCoachId);

  // Coach info state
  const [coachInfo, setCoachInfo] = useState<CoachInfo | null>(null);
  const [isLoadingCoachInfo, setIsLoadingCoachInfo] = useState(false);

  // Disconnect dialog state
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [disconnectChoice, setDisconnectChoice] = useState<"keep" | "restore">("keep");
  const [archivedSplitInfo, setArchivedSplitInfo] = useState<ArchivedSplitInfo | null>(null);
  const [isLoadingArchivedInfo, setIsLoadingArchivedInfo] = useState(false);

  // Fetch coach info when linked
  useEffect(() => {
    if (isLinked) {
      setIsLoadingCoachInfo(true);
      fetch("/api/client/coach-notes")
        .then((res) => res.json())
        .then((data) => {
          setCoachInfo({
            coachBio: data.coachBio || null,
            autonomyLevel: data.autonomyLevel || "standard",
          });
        })
        .catch((err) => {
          console.error("Failed to fetch coach info:", err);
          setCoachInfo(null);
        })
        .finally(() => {
          setIsLoadingCoachInfo(false);
        });
    }
  }, [isLinked]);

  // Fetch archived split info when dialog opens
  useEffect(() => {
    if (showDisconnectDialog) {
      setIsLoadingArchivedInfo(true);
      fetch("/api/client/leave-coach")
        .then((res) => res.json())
        .then((data) => {
          setArchivedSplitInfo(data.archivedSplit || null);
          // Default to 'keep' if no archived split, otherwise let user choose
          setDisconnectChoice(data.hasArchivedSplit ? "keep" : "keep");
        })
        .catch((err) => {
          console.error("Failed to fetch archived split info:", err);
          setArchivedSplitInfo(null);
        })
        .finally(() => {
          setIsLoadingArchivedInfo(false);
        });
    }
  }, [showDisconnectDialog]);

  const handleSubmit = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/client/join-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect with coach");
      }

      setSuccess(true);
      setLinkedCoachName(data.coachName || "Coach");
      setIsLinked(true);
      setCode("");

      // Refresh page after short delay to show success
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectClick = () => {
    setShowDisconnectDialog(true);
  };

  const handleDisconnectConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/client/leave-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restorePreviousSplit: disconnectChoice === "restore",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect from coach");
      }

      setIsLinked(false);
      setLinkedCoachName(null);
      setShowDisconnectDialog(false);

      // Refresh page
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatSplitType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getAutonomyConfig = (level: "minimal" | "standard" | "full") => {
    const configs = {
      minimal: {
        label: t("autonomy.minimal"),
        description: t("autonomy.minimalDesc"),
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      },
      standard: {
        label: t("autonomy.standard"),
        description: t("autonomy.standardDesc"),
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      full: {
        label: t("autonomy.full"),
        description: t("autonomy.fullDesc"),
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      },
    };
    return configs[level] || configs.standard;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {isLinked && linkedCoachName ? (
        // Connected state
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t("connectedTo")}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {linkedCoachName}
                </div>
              </div>
              <button
                onClick={handleDisconnectClick}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                title={t("disconnect")}
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
              </button>
            </div>

            {/* Coach Bio */}
            {coachInfo?.coachBio && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {coachInfo.coachBio}
                </p>
              </div>
            )}
          </div>

          {/* Autonomy Level */}
          {coachInfo && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("autonomy.title")}
                </span>
                <span className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  getAutonomyConfig(coachInfo.autonomyLevel).color
                )}>
                  {getAutonomyConfig(coachInfo.autonomyLevel).label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {getAutonomyConfig(coachInfo.autonomyLevel).description}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("connectedDescription")}
          </p>
        </div>
      ) : (
        // Not connected state
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder={t("placeholder")}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
                "font-mono uppercase tracking-wider",
                error
                  ? "border-red-300 dark:border-red-700"
                  : "border-gray-200 dark:border-gray-700"
              )}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={!code.trim() || isLoading}
              className={cn(
                "px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2",
                code.trim() && !isLoading
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <Check className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t("success")}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("instructions")}
          </p>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("disconnectTitle")}</DialogTitle>
            <DialogDescription>
              {t("disconnectDescription")}
            </DialogDescription>
          </DialogHeader>

          {isLoadingArchivedInfo ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {/* Option: Keep current plan */}
              <button
                onClick={() => setDisconnectChoice("keep")}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  disconnectChoice === "keep"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      disconnectChoice === "keep"
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    {disconnectChoice === "keep" && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {t("keepCurrentPlan")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t("keepCurrentPlanDescription")}
                    </p>
                  </div>
                </div>
              </button>

              {/* Option: Restore previous plan */}
              <button
                onClick={() => archivedSplitInfo && setDisconnectChoice("restore")}
                disabled={!archivedSplitInfo}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  !archivedSplitInfo && "opacity-50 cursor-not-allowed",
                  disconnectChoice === "restore"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      disconnectChoice === "restore"
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    {disconnectChoice === "restore" && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {t("restorePreviousPlan")}
                      </span>
                    </div>
                    {archivedSplitInfo ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t("restorePreviousPlanDescription", {
                          splitType: formatSplitType(archivedSplitInfo.splitType),
                        })}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {t("noPreviousPlan")}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-2">
            <button
              onClick={() => setShowDisconnectDialog(false)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleDisconnectConfirm}
              disabled={isLoading || isLoadingArchivedInfo}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("confirmDisconnect")
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
