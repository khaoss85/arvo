'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function GymPricing() {
  const t = useTranslations('landing.forGyms.pricing');

  const plans = [
    {
      key: 'basic',
      featured: false,
      features: ['members', 'whiteLabel', 'ai', 'app', 'analytics'],
    },
    {
      key: 'professional',
      featured: true,
      features: ['members', 'everything', 'staff', 'analytics', 'support', 'registration'],
    },
    {
      key: 'enterprise',
      featured: false,
      features: ['members', 'everything', 'manager', 'api', 'integrations', 'sla'],
    },
  ];

  return (
    <section className="py-24 px-4">
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

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className={`h-full relative ${plan.featured ? 'border-2 border-primary-500 shadow-lg' : ''}`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {t(`${plan.key}.badge`)}
                    </span>
                  </div>
                )}
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{t(`${plan.key}.name`)}</h3>
                    <p className="text-muted-foreground text-sm">{t(`${plan.key}.description`)}</p>
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{t(`${plan.key}.features.${feature}`)}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/contact" className="w-full">
                    <Button
                      className="w-full group"
                      variant={plan.featured ? 'default' : 'outline'}
                    >
                      {t('contactCta')}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
