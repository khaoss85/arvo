'use client';

import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, TrendingUp, Code2 } from "lucide-react";
import { useTranslations } from 'next-intl';

interface HeroSectionGymProps {
  isAuthenticated: boolean;
  showWaitlist?: boolean;
}

export function HeroSectionGym({ isAuthenticated, showWaitlist = false }: HeroSectionGymProps) {
  const t = useTranslations('landing.forGyms.hero');

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
                {t('title')}
              </span>
              <br />
              {t('subtitle')}
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('description')}
          </motion.p>

          {/* Stats Pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
              <Clock className="inline-block w-4 h-4 mr-1" />
              <span className="font-bold">{t('stats.setup')}</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
              <TrendingUp className="inline-block w-4 h-4 mr-1" />
              <span className="font-bold">{t('stats.retention')}</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
              <Code2 className="inline-block w-4 h-4 mr-1" />
              <span className="font-bold">{t('stats.development')}</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href={isAuthenticated ? "/gym-admin" : (showWaitlist ? "/waitlist" : "/login")}>
              <Button size="lg" className="text-base px-8 h-12 group">
                {isAuthenticated ? "Go to Gym Admin" : (showWaitlist ? "Join the Waitlist" : t('cta.primary'))}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <button
              onClick={() => {
                document.getElementById('pain-point')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              {t('cta.secondary')}
            </button>
          </motion.div>
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
