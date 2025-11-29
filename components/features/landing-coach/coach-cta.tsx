'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';

interface CoachCTAProps {
  isAuthenticated: boolean;
  showWaitlist?: boolean;
}

export function CoachCTA({ isAuthenticated, showWaitlist = false }: CoachCTAProps) {
  const t = useTranslations('landing.forTrainers.cta');

  return (
    <section className="py-24 px-4">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-3xl p-12 md:p-16 text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {t('title')}
            </h2>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-8">
              {t('subtitle')}
            </p>

            <Link href={isAuthenticated ? "/dashboard" : (showWaitlist ? "/waitlist" : "/login")}>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-14 group bg-white text-primary-700 hover:bg-primary-50 border-white"
              >
                {isAuthenticated ? "Go to Dashboard" : (showWaitlist ? "Join the Waitlist" : t('button'))}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <p className="text-sm text-primary-200 mt-4">
              {t('note')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
