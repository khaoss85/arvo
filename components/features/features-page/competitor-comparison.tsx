'use client';

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { useTranslations } from 'next-intl';

type FeatureValue = 'full' | 'partial' | 'none' | string;

interface ComparisonRow {
  feature: string;
  arvo: FeatureValue;
  fitbod: FeatureValue;
  freeletics: FeatureValue;
  strong: FeatureValue;
  hevy: FeatureValue;
  juggernautai: FeatureValue;
  evolveai: FeatureValue;
  zingai: FeatureValue;
  drmuscle: FeatureValue;
  caliber: FeatureValue;
}

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === 'full') {
    return (
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
      </div>
    );
  }

  if (value === 'partial') {
    return (
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <Minus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
      </div>
    );
  }

  if (value === 'none') {
    return (
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
      </div>
    );
  }

  // String value (like "19 specialized" or "1 generic")
  return (
    <div className="text-center text-sm font-medium">
      {value}
    </div>
  );
}

export function CompetitorComparison() {
  const t = useTranslations('features.comparison');

  const competitors = [
    'Arvo', 'Fitbod', 'Freeletics', 'Strong', 'Hevy',
    'JuggernautAI', 'Evolve AI', 'Zing AI', 'Dr. Muscle', 'Caliber'
  ];

  const comparisonData: ComparisonRow[] = [
    {
      feature: 'aiAgents',
      arvo: '19 specialized',
      fitbod: '1 generic',
      freeletics: '0',
      strong: '0',
      hevy: '0',
      juggernautai: '1 (powerlifting)',
      evolveai: '1 (strength)',
      zingai: '1 generic',
      drmuscle: '1 generic',
      caliber: 'Human coach',
    },
    {
      feature: 'setBySet',
      arvo: 'full',
      fitbod: 'none',
      freeletics: 'none',
      strong: 'none',
      hevy: 'none',
      juggernautai: 'partial',
      evolveai: 'partial',
      zingai: 'none',
      drmuscle: 'partial',
      caliber: 'none',
    },
    {
      feature: 'methodologies',
      arvo: 'Kuba, Mentzer, FST-7...',
      fitbod: 'Generic',
      freeletics: 'Generic',
      strong: 'Manual',
      hevy: 'Manual',
      juggernautai: 'Powerlifting',
      evolveai: 'Strength',
      zingai: 'Generic',
      drmuscle: 'Generic',
      caliber: 'Coach-based',
    },
    {
      feature: 'rirRpe',
      arvo: 'full',
      fitbod: 'partial',
      freeletics: 'none',
      strong: 'full',
      hevy: 'full',
      juggernautai: 'full',
      evolveai: 'full',
      zingai: 'partial',
      drmuscle: 'full',
      caliber: 'partial',
    },
    {
      feature: 'volumeLandmarks',
      arvo: 'full',
      fitbod: 'none',
      freeletics: 'none',
      strong: 'none',
      hevy: 'none',
      juggernautai: 'none',
      evolveai: 'partial',
      zingai: 'none',
      drmuscle: 'none',
      caliber: 'none',
    },
    {
      feature: 'patternLearning',
      arvo: 'full',
      fitbod: 'partial',
      freeletics: 'none',
      strong: 'none',
      hevy: 'none',
      juggernautai: 'partial',
      evolveai: 'partial',
      zingai: 'partial',
      drmuscle: 'partial',
      caliber: 'full',
    },
    {
      feature: 'substitutions',
      arvo: 'full',
      fitbod: 'partial',
      freeletics: 'none',
      strong: 'none',
      hevy: 'none',
      juggernautai: 'none',
      evolveai: 'none',
      zingai: 'none',
      drmuscle: 'partial',
      caliber: 'full',
    },
    {
      feature: 'naturalLanguage',
      arvo: 'full',
      fitbod: 'none',
      freeletics: 'none',
      strong: 'none',
      hevy: 'none',
      juggernautai: 'none',
      evolveai: 'none',
      zingai: 'partial',
      drmuscle: 'none',
      caliber: 'full',
    },
    {
      feature: 'offline',
      arvo: 'full',
      fitbod: 'partial',
      freeletics: 'partial',
      strong: 'full',
      hevy: 'full',
      juggernautai: 'partial',
      evolveai: 'partial',
      zingai: 'partial',
      drmuscle: 'partial',
      caliber: 'none',
    },
  ];

  // Map competitor names to their data keys
  const competitorKeys: Record<string, keyof ComparisonRow> = {
    'Arvo': 'arvo',
    'Fitbod': 'fitbod',
    'Freeletics': 'freeletics',
    'Strong': 'strong',
    'Hevy': 'hevy',
    'JuggernautAI': 'juggernautai',
    'Evolve AI': 'evolveai',
    'Zing AI': 'zingai',
    'Dr. Muscle': 'drmuscle',
    'Caliber': 'caliber',
  };

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
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
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          className="overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-3 font-semibold">{t('feature')}</th>
                {competitors.map((competitor, index) => (
                  <th
                    key={competitor}
                    className={`py-4 px-2 font-semibold text-center text-xs sm:text-sm ${
                      index === 0 ? 'bg-primary-50 dark:bg-primary-900/30 rounded-t-lg' : ''
                    }`}
                  >
                    {competitor}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, rowIndex) => (
                <motion.tr
                  key={row.feature}
                  className="border-b border-border/50"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
                >
                  <td className="py-4 px-3">
                    <span className="font-medium text-sm">{t(`features.${row.feature}`)}</span>
                  </td>
                  {competitors.map((competitor, index) => {
                    const key = competitorKeys[competitor];
                    return (
                      <td
                        key={competitor}
                        className={`py-4 px-2 ${
                          index === 0 ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                        }`}
                      >
                        <FeatureCell value={row[key]} />
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-muted-foreground">{t('legend.full')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Minus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-muted-foreground">{t('legend.partial')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <X className="w-3 h-3 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-muted-foreground">{t('legend.none')}</span>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          className="mt-8 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {t('disclaimer')}
        </motion.p>
      </div>
    </section>
  );
}
