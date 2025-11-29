'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from 'next-intl';

export function CoachFAQ() {
  const t = useTranslations('landing.forTrainers.faq');
  const [openItem, setOpenItem] = useState<string | null>(null);

  const faqItems = [
    { key: 'invite' },
    { key: 'clientPay' },
    { key: 'customize' },
    { key: 'seeProgress' },
    { key: 'clientSwitch' },
    { key: 'maxClients' },
  ];

  const toggleItem = (key: string) => {
    setOpenItem(openItem === key ? null : key);
  };

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {faqItems.map((item) => (
            <div
              key={item.key}
              className={`bg-background border rounded-lg overflow-hidden transition-colors ${
                openItem === item.key ? 'border-primary-300 dark:border-primary-700' : ''
              }`}
            >
              <button
                onClick={() => toggleItem(item.key)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold">{t(`items.${item.key}.question`)}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    openItem === item.key ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openItem === item.key && (
                <div className="px-6 pb-4">
                  <p className="text-muted-foreground">
                    {t(`items.${item.key}.answer`)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
