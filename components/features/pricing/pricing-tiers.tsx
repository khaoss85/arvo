'use client';

import { motion } from "framer-motion";
import { Check, X, Sparkles, Building2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from 'next-intl';

interface PricingTiersProps {
  isAuthenticated: boolean;
}

interface TierFeature {
  text: string;
  included: boolean;
}

interface PricingTierProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: TierFeature[];
  badge?: string;
  badgeColor?: string;
  highlighted?: boolean;
  cta: string;
  ctaLink: string;
  ctaDisabled?: boolean;
  icon: React.ReactNode;
  delay: number;
}

function PricingTier({
  name,
  price,
  period,
  description,
  features,
  badge,
  badgeColor = "bg-muted",
  highlighted = false,
  cta,
  ctaLink,
  ctaDisabled = false,
  icon,
  delay,
}: PricingTierProps) {
  return (
    <motion.div
      className={`relative p-6 rounded-2xl border ${
        highlighted
          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
          : 'border-border bg-background'
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
          {badge}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 ${
          highlighted
            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
            : 'bg-muted text-muted-foreground'
        }`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-4xl font-bold ${highlighted ? 'text-primary-600 dark:text-primary-400' : ''}`}>
            {price}
          </span>
          {period && (
            <span className="text-muted-foreground">{period}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? '' : 'text-muted-foreground/50'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {ctaDisabled ? (
        <Button className="w-full" variant="outline" disabled>
          {cta}
        </Button>
      ) : (
        <Link href={ctaLink} className="block">
          <Button className="w-full" variant={highlighted ? 'default' : 'outline'}>
            {cta}
          </Button>
        </Link>
      )}
    </motion.div>
  );
}

export function PricingTiers({ isAuthenticated }: PricingTiersProps) {
  const t = useTranslations('pricing.tiers');

  const tiers = [
    {
      name: t('free.name'),
      price: '€0',
      description: t('free.description'),
      features: [
        { text: t('features.aiAgents'), included: true },
        { text: t('features.setBySet'), included: true },
        { text: t('features.simpleMode'), included: true },
        { text: t('features.basicMethodologies'), included: true },
        { text: t('features.advancedMethodologies'), included: false },
        { text: t('features.volumeTracking'), included: false },
        { text: t('features.audioCoaching'), included: false },
      ],
      badge: t('free.badge'),
      badgeColor: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
      cta: isAuthenticated ? t('free.ctaActive') : t('free.cta'),
      ctaLink: isAuthenticated ? '/dashboard' : '/login',
      icon: <Zap className="w-6 h-6" />,
      delay: 0,
    },
    {
      name: t('pro.name'),
      price: '€6',
      period: t('pro.period'),
      description: t('pro.description'),
      features: [
        { text: t('features.everythingFree'), included: true },
        { text: t('features.advancedMethodologies'), included: true },
        { text: t('features.volumeTracking'), included: true },
        { text: t('features.patternLearning'), included: true },
        { text: t('features.audioCoaching'), included: true },
        { text: t('features.prioritySupport'), included: true },
        { text: t('features.exportData'), included: true },
      ],
      badge: t('pro.badge'),
      badgeColor: 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400',
      highlighted: true,
      cta: t('pro.cta'),
      ctaLink: isAuthenticated ? '/dashboard' : '/login',
      icon: <Sparkles className="w-6 h-6" />,
      delay: 0.1,
    },
    {
      name: t('team.name'),
      price: t('team.price'),
      description: t('team.description'),
      features: [
        { text: t('features.everythingPro'), included: true },
        { text: t('features.multiUser'), included: true },
        { text: t('features.customBranding'), included: true },
        { text: t('features.apiAccess'), included: true },
        { text: t('features.dedicatedSupport'), included: true },
        { text: t('features.analytics'), included: true },
        { text: t('features.onboarding'), included: true },
      ],
      badge: t('team.badge'),
      badgeColor: 'bg-muted text-muted-foreground',
      cta: t('team.cta'),
      ctaLink: 'mailto:team@arvo.guru',
      ctaDisabled: true,
      icon: <Building2 className="w-6 h-6" />,
      delay: 0.2,
    },
  ];

  return (
    <section className="py-24 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Section Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Tiers Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <PricingTier key={tier.name} {...tier} />
          ))}
        </div>

        {/* Annual Savings Note */}
        <motion.p
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t('annualSavings')}
        </motion.p>
      </div>
    </section>
  );
}
