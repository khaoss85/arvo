'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useTranslations } from 'next-intl';

export function SimpleResults() {
  const t = useTranslations('landingSimple.simpleResults');

  const testimonials = [
    {
      quote: t('testimonial1.quote'),
      name: t('testimonial1.name'),
      result: t('testimonial1.result'),
    },
    {
      quote: t('testimonial2.quote'),
      name: t('testimonial2.name'),
      result: t('testimonial2.result'),
    },
    {
      quote: t('testimonial3.quote'),
      name: t('testimonial3.name'),
      result: t('testimonial3.result'),
    },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('title')}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-4" />
                  <p className="text-muted-foreground mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                      {testimonial.result}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
