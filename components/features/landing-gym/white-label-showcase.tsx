'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Image, Palette, MessageSquare, Link2, UserPlus, Check } from "lucide-react";
import { useTranslations } from 'next-intl';

export function WhiteLabelShowcase() {
  const t = useTranslations('landing.forGyms.whiteLabel');

  const features = [
    { icon: Image, text: t('features.logo'), color: 'bg-blue-500' },
    { icon: Palette, text: t('features.colors'), color: 'bg-purple-500' },
    { icon: MessageSquare, text: t('features.messages'), color: 'bg-green-500' },
    { icon: Link2, text: t('features.url'), color: 'bg-orange-500' },
    { icon: UserPlus, text: t('features.onboarding'), color: 'bg-pink-500' },
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

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden border-2 border-primary-200 dark:border-primary-800">
              <CardContent className="p-0">
                {/* Branding Editor Mockup */}
                <div className="bg-muted/50 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">YG</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg">Your Gym Name</p>
                      <p className="text-sm text-muted-foreground">arvo.guru/join/gym/your-gym</p>
                    </div>
                  </div>

                  {/* Color Palette Preview */}
                  <div className="flex gap-2 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-500 border-2 border-white shadow-sm" />
                    <div className="w-12 h-12 rounded-lg bg-primary-300 border-2 border-white shadow-sm" />
                    <div className="w-12 h-12 rounded-lg bg-primary-700 border-2 border-white shadow-sm" />
                    <div className="w-12 h-12 rounded-lg bg-primary-100 border-2 border-white shadow-sm" />
                  </div>

                  {/* Font Preview */}
                  <div className="bg-background rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Welcome Message</p>
                    <p className="font-medium">&ldquo;Welcome to Your Gym! Start your fitness journey today.&rdquo;</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{feature.text}</p>
                </div>
                <Check className="w-5 h-5 text-primary-500" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
