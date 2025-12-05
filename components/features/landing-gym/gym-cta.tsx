'use client';

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface GymCTAProps {
  isAuthenticated: boolean;
  showWaitlist?: boolean;
}

export function GymCTA({ isAuthenticated, showWaitlist = false }: GymCTAProps) {
  const t = useTranslations('landing.forGyms.cta');

  return (
    <section className="py-24 px-4">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          className="text-center bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-12 text-white"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-8">
            {t('subtitle')}
          </p>

          <Link href={isAuthenticated ? "/gym-admin" : (showWaitlist ? "/waitlist" : "/contact")}>
            <Button size="lg" variant="outline" className="text-base px-8 h-12 group bg-white text-primary-700 hover:bg-primary-50">
              {isAuthenticated ? "Go to Gym Admin" : (showWaitlist ? "Join the Waitlist" : t('button'))}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <p className="text-sm text-primary-200 mt-4">
            {t('note')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
