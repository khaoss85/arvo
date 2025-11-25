'use client';

import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from 'next-intl';

interface HeroSectionProps {
  isAuthenticated: boolean;
  showWaitlist?: boolean;
}

export function HeroSection({ isAuthenticated, showWaitlist = false }: HeroSectionProps) {
  const t = useTranslations('landing.hero');
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-geometric-pattern px-4 py-20">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Logo size="lg" showTagline={false} animated={false} />
          </motion.div>

          {/* Headline */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
                {t('title.aiCoach')}
              </span>
              <br />
              {t('title.subtitle')}
            </h1>
          </motion.div>

          {/* Pain Point */}
          <motion.p
            className="text-base md:text-lg text-muted-foreground/80 max-w-2xl italic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {t('painPoints')}
          </motion.p>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('description.main')}
            <br />
            <span className="text-sm md:text-base mt-2 inline-block">
              {t('description.methods')}
            </span>
          </motion.p>

          {/* Stats Pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
              <Sparkles className="inline-block w-4 h-4 mr-1" />
              {t('stats.agents')}
            </div>
            <div className="px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
              {t('stats.exercises')}
            </div>
            <div className="px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
              {t('stats.methods')}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href={isAuthenticated ? "/dashboard" : (showWaitlist ? "/waitlist" : "/login")}>
              <Button size="lg" className="text-base px-8 h-12 group">
                {isAuthenticated ? t('cta.dashboard') : (showWaitlist ? "Join the Waitlist" : t('cta.start'))}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {showWaitlist && !isAuthenticated && (
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Already have an account? <span className="underline">Login</span>
              </Link>
            )}

            <button
              onClick={() => {
                document.getElementById('ai-showcase')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              {t('cta.seeHow')}
            </button>
          </motion.div>

          {/* Technical Note */}
          <motion.p
            className="text-xs text-muted-foreground/70 max-w-2xl pt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {t('technical.powered')}
            <br />
            {t('technical.promise')}
          </motion.p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: 0.5,
        }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-primary-400 dark:border-primary-600 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-600" />
        </div>
      </motion.div>
    </section>
  );
}
