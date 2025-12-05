'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, BarChart3, Wrench, ShieldAlert, TrendingUp } from "lucide-react";
import { useTranslations } from 'next-intl';

export function AIValueGym() {
  const t = useTranslations('landing.forGyms.aiValue');

  const features = [
    { icon: Sparkles, text: t('features.methodologies'), color: 'from-purple-500 to-pink-500' },
    { icon: BarChart3, text: t('features.volume'), color: 'from-blue-500 to-cyan-500' },
    { icon: Wrench, text: t('features.equipment'), color: 'from-orange-500 to-amber-500' },
    { icon: ShieldAlert, text: t('features.injuries'), color: 'from-red-500 to-rose-500' },
    { icon: TrendingUp, text: t('features.overload'), color: 'from-green-500 to-emerald-500' },
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-medium text-lg">{feature.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* AI Badge Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="h-full bg-gradient-to-br from-primary-500 to-primary-700 text-white">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <div className="text-4xl font-bold mb-2">20</div>
                <p className="text-primary-100">AI Agents working together for every member</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
