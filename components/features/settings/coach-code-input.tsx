"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, Check, Loader2, X, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CoachService } from "@/lib/services/coach.service";

interface CoachCodeInputProps {
  userId: string;
  currentCoachId: string | null;
  currentCoachName?: string | null;
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

  const handleDisconnect = async () => {
    if (!confirm(t("confirmDisconnect"))) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/client/leave-coach", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect from coach");
      }

      setIsLinked(false);
      setLinkedCoachName(null);

      // Refresh page
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
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
              onClick={handleDisconnect}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
              title={t("disconnect")}
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
            </button>
          </div>

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
    </div>
  );
}
