'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

export function ComparisonTable() {
  type FeatureValue = boolean | "partial" | string;

  interface Feature {
    name: string;
    arvo: FeatureValue;
    excel: FeatureValue;
    genericApps: FeatureValue;
    personalTrainer: FeatureValue;
  }

  const features: Feature[] = [
    {
      name: "AI Reasoning (GPT-5)",
      arvo: true,
      excel: false,
      genericApps: false,
      personalTrainer: "partial",
    },
    {
      name: "Set-by-set progression",
      arvo: true,
      excel: false,
      genericApps: false,
      personalTrainer: true,
    },
    {
      name: "Pattern learning",
      arvo: true,
      excel: false,
      genericApps: false,
      personalTrainer: true,
    },
    {
      name: "Natural language notes → AI insights",
      arvo: true,
      excel: false,
      genericApps: false,
      personalTrainer: false,
    },
    {
      name: "Biomechanical adjustments",
      arvo: true,
      excel: false,
      genericApps: false,
      personalTrainer: "partial",
    },
    {
      name: "Volume tracking (MEV/MAV/MRV)",
      arvo: true,
      excel: "partial",
      genericApps: false,
      personalTrainer: "partial",
    },
    {
      name: "Injury prevention",
      arvo: true,
      excel: false,
      genericApps: false,
      personalTrainer: true,
    },
    {
      name: "Offline support",
      arvo: true,
      excel: true,
      genericApps: "partial",
      personalTrainer: false,
    },
    {
      name: "Methodology fidelity",
      arvo: "Kuba/Mentzer",
      excel: "Manual",
      genericApps: "Generic",
      personalTrainer: "Varies",
    },
    {
      name: "Cost",
      arvo: "Free",
      excel: "Free",
      genericApps: "$10/mo",
      personalTrainer: "$100+/session",
    },
    {
      name: "Always available",
      arvo: true,
      excel: true,
      genericApps: true,
      personalTrainer: false,
    },
  ];

  const renderValue = (value: FeatureValue, isArvo: boolean = false) => {
    if (value === true) {
      return <Check className={`w-5 h-5 ${isArvo ? "text-primary-600 dark:text-primary-400" : "text-green-600 dark:text-green-400"}`} />;
    }
    if (value === false) {
      return <X className="w-5 h-5 text-red-400 dark:text-red-500" />;
    }
    if (value === "partial") {
      return <Minus className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
    }
    return <span className={`text-xs font-mono ${isArvo ? "text-primary-600 dark:text-primary-400 font-semibold" : "text-muted-foreground"}`}>{value}</span>;
  };

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why <span className="text-primary-600 dark:text-primary-400">Arvo</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            No marketing claims. Just feature-by-feature comparison.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-primary-50 dark:bg-primary-950/20 border-b">
              <CardTitle>Feature Comparison</CardTitle>
              <CardDescription>Arvo vs alternatives you're probably considering</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold text-primary-600 dark:text-primary-400">Arvo</th>
                      <th className="text-center p-4 font-semibold">Excel</th>
                      <th className="text-center p-4 font-semibold">Generic Apps</th>
                      <th className="text-center p-4 font-semibold">Personal Trainer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <tr
                        key={index}
                        className={`border-t ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                      >
                        <td className="p-4 font-medium text-sm">{feature.name}</td>
                        <td className="p-4 text-center bg-primary-50/50 dark:bg-primary-950/10">
                          {renderValue(feature.arvo, true)}
                        </td>
                        <td className="p-4 text-center">{renderValue(feature.excel)}</td>
                        <td className="p-4 text-center">{renderValue(feature.genericApps)}</td>
                        <td className="p-4 text-center">{renderValue(feature.personalTrainer)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {features.map((feature, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="font-semibold text-sm mb-3">{feature.name}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-2 bg-primary-50 dark:bg-primary-950/20 rounded">
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">Arvo</span>
                        {renderValue(feature.arvo, true)}
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-xs text-muted-foreground">Excel</span>
                        {renderValue(feature.excel)}
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-xs text-muted-foreground">Apps</span>
                        {renderValue(feature.genericApps)}
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-xs text-muted-foreground">Trainer</span>
                        {renderValue(feature.personalTrainer)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-muted-foreground">Full support</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <span className="text-muted-foreground">Partial/Varies</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-400 dark:text-red-500" />
            <span className="text-muted-foreground">Not available</span>
          </div>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-block bg-background border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">The reality:</span> Excel gives you full control but zero intelligence. Generic apps track sets but don't understand progression. PTs are great but expensive and unavailable 24/7. Arvo combines AI reasoning with always-on availability at zero cost.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
