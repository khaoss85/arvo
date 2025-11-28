'use client';

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

interface MedicalDisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel?: () => void;
  title?: string;
  context?: "onboarding" | "injury_tracking" | "general";
}

export function MedicalDisclaimerModal({
  open,
  onAccept,
  onCancel,
  title,
  context = "general",
}: MedicalDisclaimerModalProps) {
  const t = useTranslations("legal.medicalDisclaimer");
  const tCommon = useTranslations("common.buttons");
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
      setAgreed(false); // Reset for next time
    }
  };

  const handleCancel = () => {
    setAgreed(false);
    if (onCancel) {
      onCancel();
    }
  };

  // Context-specific content
  const getContextContent = () => {
    switch (context) {
      case "onboarding":
        return {
          description: t("onboarding.description"),
          emphasis: t("onboarding.emphasis"),
        };
      case "injury_tracking":
        return {
          description: "Before tracking pain or injuries, please understand these important limitations.",
          emphasis: "This feature cannot diagnose injuries or determine if exercise is safe for you.",
        };
      default:
        return {
          description: t("onboarding.description"),
          emphasis: t("onboarding.emphasis"),
        };
    }
  };

  const content = getContextContent();
  const displayTitle = title || t("title");

  return (
    <Dialog open={open} onOpenChange={onCancel ? () => handleCancel() : undefined}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 shrink-0 mt-1" />
            <div>
              <DialogTitle className="text-xl">{displayTitle}</DialogTitle>
              <DialogDescription className="mt-2">
                {content.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Key Points */}
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="font-semibold text-orange-900 dark:text-orange-200 mb-3">
              {content.emphasis}
            </p>
            <p className="text-sm text-orange-800 dark:text-orange-300">
              {t("consultProfessional")}
            </p>
          </div>

          {/* Main Points */}
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">{t("sections.aiCannot.title")}</h4>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                {(t.raw("sections.aiCannot.items") as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("sections.stopExercise.title")}</h4>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                {(t.raw("sections.stopExercise.items") as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t("sections.responsibilities.title")}</h4>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                {(t.raw("sections.responsibilities.items") as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <h4 className="font-semibold mb-2">{t("sections.assumptionOfRisk.title")}</h4>
              <p className="text-muted-foreground">
                {t("sections.assumptionOfRisk.description")}
              </p>
            </div>
          </div>

          {/* Read Full Disclaimer Link */}
          <div className="pt-3 border-t">
            <Link
              href="/medical-disclaimer"
              target="_blank"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              {t("readFullDisclaimer")}
            </Link>
          </div>

          {/* Consent Checkbox - Highlighted for visibility */}
          <div className="p-4 mt-2 bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-300 dark:border-orange-700 rounded-lg">
            <div className="flex items-start gap-3">
              <Checkbox
                id="medical-disclaimer-consent"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="mt-0.5 h-5 w-5 border-2 border-orange-400 dark:border-orange-500 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
              />
              <label
                htmlFor="medical-disclaimer-consent"
                className="text-sm leading-relaxed cursor-pointer select-none font-medium text-orange-900 dark:text-orange-100"
              >
                {t("consent")}
              </label>
            </div>
            {!agreed && (
              <p className="mt-2 text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {t("checkboxRequired") || "Devi confermare per continuare"}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onCancel && (
            <Button variant="outline" onClick={handleCancel} className="sm:flex-1">
              {tCommon("cancel")}
            </Button>
          )}
          <Button
            onClick={handleAccept}
            disabled={!agreed}
            className="sm:flex-1"
          >
            {t("acceptButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
