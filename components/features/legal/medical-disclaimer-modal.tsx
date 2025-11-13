'use client';

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
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
  title = "Medical Disclaimer",
  context = "general",
}: MedicalDisclaimerModalProps) {
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
          description: "Before we generate your first AI-powered workout, please read this important safety information.",
          emphasis: "AI-generated workouts are educational tools, not medical advice or professional coaching.",
        };
      case "injury_tracking":
        return {
          description: "Before tracking pain or injuries, please understand these important limitations.",
          emphasis: "This feature cannot diagnose injuries or determine if exercise is safe for you.",
        };
      default:
        return {
          description: "Please read this important safety information about using Arvo.",
          emphasis: "Arvo is not a substitute for professional medical advice or coaching.",
        };
    }
  };

  const content = getContextContent();

  return (
    <Dialog open={open} onOpenChange={onCancel ? () => handleCancel() : undefined}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 shrink-0 mt-1" />
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
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
              Always consult with a qualified healthcare professional before starting any exercise program.
            </p>
          </div>

          {/* Main Points */}
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">⚠️ AI Cannot:</h4>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Provide medical advice, diagnosis, or treatment</li>
                <li>Replace professional healthcare or coaching</li>
                <li>Detect or prevent injuries</li>
                <li>Account for undisclosed medical conditions</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🚨 Stop Exercise and Seek Medical Help If You Experience:</h4>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Chest pain, pressure, or difficulty breathing</li>
                <li>Severe dizziness or loss of consciousness</li>
                <li>Sharp or persistent joint/muscle pain</li>
                <li>Any unusual or concerning symptoms</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">✅ Your Responsibilities:</h4>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Obtain medical clearance before exercising (if needed)</li>
                <li>Provide accurate information about your health and limitations</li>
                <li>Use proper form and technique</li>
                <li>Stop if you experience pain, discomfort, or unusual symptoms</li>
                <li>Critically evaluate AI recommendations using your own judgment</li>
              </ul>
            </div>

            <div className="pt-2 border-t">
              <h4 className="font-semibold mb-2">⚖️ Assumption of Risk:</h4>
              <p className="text-muted-foreground">
                Exercise involves inherent risks including muscle strains, joint injuries, cardiovascular events, and in rare cases, serious injury or death. By using Arvo, you voluntarily assume all risks associated with exercise and physical training.
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
              Read full medical disclaimer →
            </Link>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3 pt-4 border-t">
            <Checkbox
              id="medical-disclaimer-consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label
              htmlFor="medical-disclaimer-consent"
              className="text-sm leading-relaxed cursor-pointer select-none"
            >
              I have read and understood this medical disclaimer. I acknowledge that Arvo is not medical advice, that AI can make mistakes, and that I am solely responsible for my safety and health. I agree to consult healthcare professionals when appropriate.
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onCancel && (
            <Button variant="outline" onClick={handleCancel} className="sm:flex-1">
              Cancel
            </Button>
          )}
          <Button
            onClick={handleAccept}
            disabled={!agreed}
            className="sm:flex-1"
          >
            I Understand and Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
