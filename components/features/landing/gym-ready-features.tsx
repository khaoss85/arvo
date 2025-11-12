'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Smartphone, WifiOff, Save, Wrench } from "lucide-react";

export function GymReadyFeatures() {
  const features = [
    {
      icon: Smartphone,
      title: "Wake Lock",
      description: "Screen stays on during workouts",
      detail: "No more unlocking your phone between sets. Screen stays active with Wake Lock API.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      icon: WifiOff,
      title: "Offline Support",
      description: "Zero internet required in gym",
      detail: "All AI decisions run client-side. Full functionality without connectivity. Auto-sync when back online.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      icon: Save,
      title: "Crash Recovery",
      description: "Never lose a logged set",
      detail: "localStorage persistence after every set. App crashes? Phone dies? Your workout is safe.",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-900",
    },
    {
      icon: Wrench,
      title: "Custom Equipment",
      description: "Add your unique gym setup",
      detail: "Got a specialty machine? Custom cable attachment? Add it once, AI suggests exercises for it forever.",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-900",
    },
  ];

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
            Built for the{" "}
            <span className="text-primary-600 dark:text-primary-400">Gym</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Not another app that fails when you need it most. Designed for real training environments.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`h-full border-2 ${feature.borderColor} ${feature.bgColor} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className={`p-3 rounded-lg ${feature.bgColor} border ${feature.borderColor} w-fit mb-3`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.detail}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Code Example: Crash Recovery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Save className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Crash Recovery - localStorage Persistence
              </CardTitle>
              <CardDescription>Every set is saved immediately. Zero data loss.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                <div className="space-y-1">
                  <div className="text-green-600 dark:text-green-400">{`// After EVERY set logged:`}</div>
                  <div className="text-muted-foreground">
                    localStorage.setItem(<span className="text-primary-600 dark:text-primary-400">'workout_draft'</span>, JSON.stringify(workoutState));
                  </div>

                  <div className="text-green-600 dark:text-green-400 pt-3">{`// On app restart:`}</div>
                  <div className="text-muted-foreground">
                    const draft = localStorage.getItem(<span className="text-primary-600 dark:text-primary-400">'workout_draft'</span>);
                  </div>
                  <div className="text-muted-foreground">
                    if (draft) {`{`}
                  </div>
                  <div className="text-muted-foreground pl-2">
                    {`// Show "Resume workout?" modal`}
                  </div>
                  <div className="text-muted-foreground pl-2">
                    {`// Restore exact state: sets, reps, RIR, notes`}
                  </div>
                  <div className="text-muted-foreground">
                    {`}`}
                  </div>

                  <div className="text-green-600 dark:text-green-400 pt-3">{`// Result:`}</div>
                  <div className="text-muted-foreground">
                    <span className="text-orange-600 dark:text-orange-400">✓</span> Phone battery dies mid-workout → Resume exactly where you left
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-orange-600 dark:text-orange-400">✓</span> App crashes during heavy set → No data lost
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-orange-600 dark:text-orange-400">✓</span> Accidental swipe-close → Full recovery
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-950/40 rounded-md text-sm border border-orange-300 dark:border-orange-800">
                <p className="text-orange-900 dark:text-orange-200">
                  <strong>Real-world scenario:</strong> You're mid-squat set, phone battery hits 1%, dies. Charge it, open app → "Resume workout from Set 3?" Everything restored.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            These features aren't marketing bullet points. They're in production, battle-tested in real gyms with spotty WiFi and dying phones.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
