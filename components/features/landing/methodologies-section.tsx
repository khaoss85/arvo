'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Zap } from "lucide-react";

export function MethodologiesSection() {
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
            Training Methods with{" "}
            <span className="text-primary-600 dark:text-primary-400">Scientific Fidelity</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Not generic interpretations. Complete methodology implementations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Kuba Method */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <CardTitle>Kuba Method</CardTitle>
                </div>
                <CardDescription>Evidence-based parametric training</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configuration Depth */}
                <div className="bg-primary-50 dark:bg-primary-950/20 rounded-md p-3 border border-primary-200 dark:border-primary-800">
                  <div className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                    Implementation Depth
                  </div>
                  <div className="font-mono text-2xl font-bold text-primary-600 dark:text-primary-400">
                    362 lines
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    of configuration & methodology rules
                  </div>
                </div>

                {/* Core Principles */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Core Principles:</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-mono text-primary-600 dark:text-primary-400">2 working sets</span> per exercise @ RIR 0-1
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        Tempo: <span className="font-mono text-primary-600 dark:text-primary-400">3-1-1-1</span> (3s eccentric, 1s pause, 1s concentric, 1s squeeze)
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-mono text-primary-600 dark:text-primary-400">60%</span> lengthened-biased exercises
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        Rest: <span className="font-mono text-primary-600 dark:text-primary-400">150-180s</span> compound, <span className="font-mono text-primary-600 dark:text-primary-400">90-120s</span> isolation
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume Landmarks */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Volume Landmarks (sets/week):</div>
                  <div className="bg-muted rounded-md p-3 font-mono text-xs space-y-1">
                    <div className="grid grid-cols-4 gap-2 font-semibold text-muted-foreground mb-1">
                      <div>Muscle</div>
                      <div>MEV</div>
                      <div>MAV</div>
                      <div>MRV</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>Chest</div>
                      <div className="text-green-600 dark:text-green-400">10</div>
                      <div className="text-primary-600 dark:text-primary-400">18</div>
                      <div className="text-orange-600 dark:text-orange-400">22</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>Back</div>
                      <div className="text-green-600 dark:text-green-400">12</div>
                      <div className="text-primary-600 dark:text-primary-400">20</div>
                      <div className="text-orange-600 dark:text-orange-400">25</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>Quads</div>
                      <div className="text-green-600 dark:text-green-400">10</div>
                      <div className="text-primary-600 dark:text-primary-400">16</div>
                      <div className="text-orange-600 dark:text-orange-400">20</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    MEV: Minimum Effective Volume · MAV: Maximum Adaptive Volume · MRV: Maximum Recoverable Volume
                  </div>
                </div>

                {/* Periodization */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Periodization:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-2 border border-blue-200 dark:border-blue-900">
                      <div className="font-semibold text-blue-700 dark:text-blue-300">Weeks 1-3</div>
                      <div className="text-muted-foreground mt-1">Accumulation</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded p-2 border border-orange-200 dark:border-orange-900">
                      <div className="font-semibold text-orange-700 dark:text-orange-300">Weeks 4-5</div>
                      <div className="text-muted-foreground mt-1">Intensification</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 rounded p-2 border border-green-200 dark:border-green-900">
                      <div className="font-semibold text-green-700 dark:text-green-300">Week 6</div>
                      <div className="text-muted-foreground mt-1">Deload</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mentzer HIT */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <CardTitle>Mike Mentzer HIT</CardTitle>
                </div>
                <CardDescription>High-intensity training philosophy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configuration Depth */}
                <div className="bg-primary-50 dark:bg-primary-950/20 rounded-md p-3 border border-primary-200 dark:border-primary-800">
                  <div className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                    Implementation Depth
                  </div>
                  <div className="font-mono text-2xl font-bold text-primary-600 dark:text-primary-400">
                    532 lines
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    of configuration & methodology rules
                  </div>
                </div>

                {/* Core Principles */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Core Principles:</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-mono text-primary-600 dark:text-primary-400">1-2 sets</span> per exercise to absolute failure
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        Low volume, <span className="font-semibold">maximum intensity</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        Recovery: <span className="font-mono text-primary-600 dark:text-primary-400">4-7 days</span> between sessions
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        Pre-exhaust techniques
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Techniques */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Advanced Techniques:</div>
                  <div className="bg-muted rounded-md p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Static Holds</span>
                      <span className="font-mono text-primary-600 dark:text-primary-400">Post-failure</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Forced Reps</span>
                      <span className="font-mono text-primary-600 dark:text-primary-400">1-2 reps</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rest-Pause</span>
                      <span className="font-mono text-primary-600 dark:text-primary-400">10s rest</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Negative Emphasis</span>
                      <span className="font-mono text-primary-600 dark:text-primary-400">4-6s eccentric</span>
                    </div>
                  </div>
                </div>

                {/* Philosophy */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Training Philosophy:</div>
                  <div className="bg-background rounded-md p-3 text-sm border italic text-muted-foreground">
                    "More is not better. Better is better. Train with absolute intensity, then allow full recovery for growth."
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Typical Split:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">Workout A</div>
                      <div className="text-muted-foreground mt-1">Chest, Back, Delts</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="font-semibold">Workout B</div>
                      <div className="text-muted-foreground mt-1">Legs, Arms</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Frequency: Every 4-7 days per workout
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Note */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-block bg-background border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Knowledge-Driven Architecture:</span> Training approaches are implemented as complete knowledge bases, not hardcoded rules. AI agents query these knowledge engines to make decisions with full methodological fidelity.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
