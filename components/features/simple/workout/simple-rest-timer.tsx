"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, SkipForward, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface SimpleRestTimerProps {
  totalSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function SimpleRestTimer({
  totalSeconds,
  onComplete,
  onSkip,
}: SimpleRestTimerProps) {
  const t = useTranslations("simpleMode.restTimer");

  // Use timestamp-based calculation for background resilience
  const [startTime] = useState(() => Date.now());
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isComplete, setIsComplete] = useState(false);

  // Calculate remaining time based on elapsed time (survives tab switch/standby)
  const calculateRemaining = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  }, [startTime, totalSeconds]);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);

      if (remaining <= 0 && !isComplete) {
        setIsComplete(true);
        // Auto-dismiss after showing "Ready!" for 2 seconds
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    }, 1000);

    // Handle visibility change (tab switch, screen off)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const remaining = calculateRemaining();
        setSecondsRemaining(remaining);
        if (remaining <= 0 && !isComplete) {
          setIsComplete(true);
          setTimeout(() => onComplete(), 2000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [calculateRemaining, isComplete, onComplete]);

  // Circular progress parameters
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = (secondsRemaining / totalSeconds) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
    >
      <AnimatePresence mode="wait">
        {isComplete ? (
          // Complete state
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
            >
              <Check className="w-12 h-12 text-green-500" />
            </motion.div>
            <p className="text-xl font-bold text-green-500">{t("ready")}</p>
          </motion.div>
        ) : (
          // Timer state
          <motion.div
            key="timer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-amber-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {t("recovery")}
                </span>
              </div>
              <Button
                onClick={onSkip}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800 text-sm"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                {t("skip")}
              </Button>
            </div>

            {/* Circular Timer */}
            <div className="relative mb-4">
              <svg className="w-48 h-48 transform -rotate-90">
                {/* Track */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  className="stroke-gray-800"
                  strokeWidth="6"
                  fill="none"
                />
                {/* Progress */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  className={cn(
                    "transition-all duration-1000 ease-linear",
                    secondsRemaining <= 10
                      ? "stroke-green-500"
                      : "stroke-amber-500"
                  )}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              {/* Time Display (Centered) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div
                  className={cn(
                    "text-5xl font-bold font-mono tracking-tight",
                    secondsRemaining <= 10 ? "text-green-500" : "text-white"
                  )}
                >
                  {formatTime(secondsRemaining)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
