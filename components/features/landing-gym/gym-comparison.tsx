'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { useTranslations } from 'next-intl';

export function GymComparison() {
  const t = useTranslations('landing.forGyms.comparison');

  const rows = [
    { key: 'whiteLabel' },
    { key: 'aiWorkouts' },
    { key: 'methodologies' },
    { key: 'aiBooking' },
    { key: 'setupTime' },
    { key: 'startingPrice' },
  ];

  const renderValue = (value: string) => {
    if (value === 'No') return <X className="w-5 h-5 text-red-500 mx-auto" />;
    if (value === 'Yes' || value === 'Sì') return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    if (value === 'Partial' || value === 'Parziale') return <Minus className="w-5 h-5 text-yellow-500 mx-auto" />;
    if (value === 'Basic' || value === 'Base') return <span className="text-yellow-600 dark:text-yellow-400 font-medium">{value}</span>;
    return value;
  };

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">{t('headers.feature')}</th>
                      <th className="text-center p-4 font-medium text-muted-foreground">{t('headers.mindbody')}</th>
                      <th className="text-center p-4 font-medium text-muted-foreground">{t('headers.glofox')}</th>
                      <th className="text-center p-4 font-medium text-muted-foreground">{t('headers.virtuagym')}</th>
                      <th className="text-center p-4 font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{t('headers.arvo')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.key} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                        <td className="p-4 font-medium">{t(`rows.${row.key}.feature`)}</td>
                        <td className="p-4 text-center text-sm">{renderValue(t(`rows.${row.key}.mindbody`))}</td>
                        <td className="p-4 text-center text-sm">{renderValue(t(`rows.${row.key}.glofox`))}</td>
                        <td className="p-4 text-center text-sm">{renderValue(t(`rows.${row.key}.virtuagym`))}</td>
                        <td className="p-4 text-center bg-primary-50 dark:bg-primary-900/30">
                          <span className="font-bold text-primary-700 dark:text-primary-300">
                            {t(`rows.${row.key}.arvo`)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
