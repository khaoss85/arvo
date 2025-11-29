'use client';

import { motion } from "framer-motion";
import { Target, Trophy, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';

interface WhoIsArvoForProps {
  variant?: 'default' | 'pro' | 'simple';
}

export function WhoIsArvoFor({ variant = 'default' }: WhoIsArvoForProps) {
  const t = useTranslations('landing.whoIsArvoFor');

  const cards = [
    {
      id: 'intermediate',
      icon: Target,
      titleKey: 'cards.intermediate.title',
      subtitleKey: 'cards.intermediate.subtitle',
      features: [
        'cards.intermediate.feature1',
        'cards.intermediate.feature2',
        'cards.intermediate.feature3',
      ],
      highlight: variant === 'default' || variant === 'pro',
    },
    {
      id: 'competitive',
      icon: Trophy,
      titleKey: 'cards.competitive.title',
      subtitleKey: 'cards.competitive.subtitle',
      features: [
        'cards.competitive.feature1',
        'cards.competitive.feature2',
        'cards.competitive.feature3',
      ],
      highlight: variant === 'pro',
    },
    {
      id: 'beginners',
      icon: Sparkles,
      titleKey: 'cards.beginners.title',
      subtitleKey: 'cards.beginners.subtitle',
      features: [
        'cards.beginners.feature1',
        'cards.beginners.feature2',
        'cards.beginners.feature3',
      ],
      highlight: variant === 'simple',
    },
    {
      id: 'coaches',
      icon: Users,
      titleKey: 'cards.coaches.title',
      subtitleKey: 'cards.coaches.subtitle',
      features: [
        'cards.coaches.feature1',
        'cards.coaches.feature2',
        'cards.coaches.feature3',
      ],
      highlight: false,
      isLink: true,
      href: '/for-trainers',
    },
  ];

  return (
    <section id="who-is-arvo-for" className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const cardClassName = `
              block h-full relative p-6 lg:p-8 rounded-2xl border transition-colors
              ${card.highlight
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                : 'bg-background border-border'
              }
              ${card.isLink ? 'hover:border-primary-400 dark:hover:border-primary-600 cursor-pointer' : ''}
            `;

            const cardContent = (
              <>
                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-4
                  ${card.highlight
                    ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-600 dark:text-primary-400'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-xl font-semibold mb-2">
                  {t(card.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t(card.subtitleKey)}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {card.features.map((featureKey, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className={`
                        mt-1.5 w-1.5 h-1.5 rounded-full shrink-0
                        ${card.highlight
                          ? 'bg-primary-500'
                          : 'bg-muted-foreground/50'
                        }
                      `} />
                      {t(featureKey)}
                    </li>
                  ))}
                </ul>

                {/* Highlight badge for emphasized card */}
                {card.highlight && (
                  <div className="absolute -top-3 right-6">
                    <span className="px-3 py-1 text-xs font-medium bg-primary-500 text-white rounded-full">
                      {variant === 'simple' ? t('badges.forYou') : t('badges.popular')}
                    </span>
                  </div>
                )}

                {/* Learn More for link cards */}
                {card.isLink && (
                  <div className="absolute -top-3 right-6">
                    <span className="px-3 py-1 text-xs font-medium bg-green-500 text-white rounded-full">
                      {t('badges.learnMore')}
                    </span>
                  </div>
                )}
              </>
            );

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {card.isLink && card.href ? (
                  <Link href={card.href} className={cardClassName}>
                    {cardContent}
                  </Link>
                ) : (
                  <div className={cardClassName}>
                    {cardContent}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom SEO text */}
        <motion.p
          className="text-center text-sm text-muted-foreground/70 mt-12 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {t('seoText')}
        </motion.p>
      </div>
    </section>
  );
}
