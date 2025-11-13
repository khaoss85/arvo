'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useState } from "react";

export function FAQSection() {
  const t = useTranslations('landing.faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqKeys = [
    'offline',
    'customEquipment',
    'injury',
    'learning',
    'vsExcel',
    'dataOwnership',
    'pricing',
  ] as const;

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container max-w-4xl mx-auto">
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

        <div className="space-y-4">
          {faqKeys.map((key, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                className={`overflow-hidden cursor-pointer transition-all ${
                  openIndex === index
                    ? "border-2 border-primary-300 dark:border-primary-700"
                    : "border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-900"
                }`}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-lg text-left flex-1">
                      {t(`questions.${key}.question`)}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 text-primary-600 dark:text-primary-400 transition-transform shrink-0 ${
                        openIndex === index ? "transform rotate-180" : ""
                      }`}
                    />
                  </div>
                  {openIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-4 px-0">
                        <p className="text-muted-foreground leading-relaxed">
                          {t(`questions.${key}.answer`)}
                        </p>
                      </CardContent>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground">
            {t('cta.text')}{" "}
            <a
              href={`mailto:${t('cta.email')}`}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              {t('cta.email')}
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
