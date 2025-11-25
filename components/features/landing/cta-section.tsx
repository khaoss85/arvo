'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { WaitlistForm } from "./waitlist-form";

interface CTASectionProps {
  isAuthenticated: boolean;
  showWaitlist?: boolean; // If true, show waitlist form instead of normal CTA
}

export function CTASection({ isAuthenticated, showWaitlist = false }: CTASectionProps) {
  const t = useTranslations('landing.cta');

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-primary-50 dark:to-primary-950/20">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          className="text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">
              {showWaitlist && !isAuthenticated ? (
                <>
                  Join the{" "}
                  <span className="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
                    Waitlist
                  </span>
                </>
              ) : (
                <>
                  {t('title.part1')}{" "}
                  <span className="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
                    {t('title.part2')}
                  </span>
                </>
              )}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {showWaitlist && !isAuthenticated
                ? "Be among the first to experience AI-powered training. Early access for serious lifters who want to transform their training."
                : t('subtitle')}
            </p>
          </div>

          {showWaitlist && !isAuthenticated ? (
            <>
              {/* Waitlist Benefits */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                <div className="px-4 py-2 rounded-full bg-background border border-border">
                  ✓ Early access to AI coach
                </div>
                <div className="px-4 py-2 rounded-full bg-background border border-border">
                  ✓ Skip the line by inviting friends
                </div>
                <div className="px-4 py-2 rounded-full bg-background border border-border">
                  ✓ Unlock premium features
                </div>
              </div>

              {/* Waitlist Form */}
              <div className="pt-4">
                <WaitlistForm inline />
              </div>

              {/* Login link for existing users */}
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 underline transition-colors"
                >
                  Login
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Features Pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                <div className="px-4 py-2 rounded-full bg-background border border-border">
                  ✓ {t('features.onboarding')}
                </div>
                <div className="px-4 py-2 rounded-full bg-background border border-border">
                  ✓ {t('features.instantGeneration')}
                </div>
                <div className="px-4 py-2 rounded-full bg-background border border-border">
                  ✓ {t('features.freeToStart')}
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                  <Button size="lg" className="text-base px-8 h-12 group">
                    {isAuthenticated ? t('button.dashboard') : t('button.startWorkout')}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Technical Note */}
              <p className="text-xs text-muted-foreground/70 max-w-2xl mx-auto">
                {t('technical.noCreditCard')}{" "}
                {t('technical.magicLink')}
                <br />
                {t('technical.privacyFirst')}
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
