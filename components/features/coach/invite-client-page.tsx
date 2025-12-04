"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  Clock,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CoachProfile, CoachClientRelationship } from "@/lib/types/schemas";

interface InviteClientPageProps {
  coachProfile: CoachProfile | null;
  pendingInvites: CoachClientRelationship[];
}

export function InviteClientPage({
  coachProfile,
  pendingInvites,
}: InviteClientPageProps) {
  const t = useTranslations("coach.invite");
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyInviteCode = async () => {
    if (!coachProfile?.invite_code) return;

    try {
      await navigator.clipboard.writeText(coachProfile.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/coach")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Invite Code Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
              <UserPlus className="w-8 h-8 text-orange-500" />
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("codeLabel")}
            </h2>

            {coachProfile?.invite_code ? (
              <>
                {/* Large Code Display */}
                <div className="flex items-center justify-center gap-3 my-6">
                  <div className="font-mono text-3xl font-bold text-orange-600 dark:text-orange-400 tracking-wider">
                    {coachProfile.invite_code}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className={cn(
                      "p-3 rounded-xl transition-all",
                      copied
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                    title={t("copySuccess")}
                  >
                    {copied ? (
                      <Check className="w-6 h-6 text-green-500" />
                    ) : (
                      <Copy className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Copy Success Toast */}
                {copied && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
                    <Check className="w-4 h-4" />
                    {t("copySuccess")}
                  </div>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {t("shareInstructions")}
                </p>
              </>
            ) : (
              <div className="py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No invite code available. Please contact support.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Section (placeholder) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4 text-center justify-center">
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
              <QrCode className="w-24 h-24 text-gray-300 dark:text-gray-600" />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            QR code for easy sharing (coming soon)
          </p>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Pending Invites ({pendingInvites.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Client ID: {invite.client_id.slice(0, 8)}...
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Invited{" "}
                      {invite.invited_at
                        ? new Date(invite.invited_at).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
