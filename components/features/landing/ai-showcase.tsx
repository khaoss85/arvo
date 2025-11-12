'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Zap, ArrowRight } from "lucide-react";

export function AIShowcase() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="ai-showcase" className="py-24 px-4 bg-muted/30">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            AI That Actually <span className="text-primary-600 dark:text-primary-400">Reasons</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Not just random exercise suggestions. See real AI decisions with complete reasoning.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Example 1: Exercise Selector */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      Exercise Architect
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Architects your training using GPT-5 reasoning · AI Agent
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Input */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">INPUT CONTEXT:</div>
                  <div className="bg-muted rounded-md p-3 text-sm font-mono space-y-1">
                    <div><span className="text-primary-600 dark:text-primary-400">weakPoints:</span> ["upper_chest"]</div>
                    <div><span className="text-primary-600 dark:text-primary-400">mesocyclePhase:</span> "accumulation"</div>
                    <div><span className="text-primary-600 dark:text-primary-400">caloricPhase:</span> "bulk"</div>
                    <div><span className="text-primary-600 dark:text-primary-400">activeInsights:</span> [{"{"}"severity": "warning", "exercise": "Dips"{"}"}]</div>
                  </div>
                </div>

                {/* Process */}
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-primary-500 animate-pulse" />
                </div>

                {/* Output */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">AI REASONING OUTPUT:</div>
                  <div className="bg-background rounded-md p-3 text-sm font-mono space-y-2 border">
                    <div className="text-green-600 dark:text-green-400">// Selected Exercises:</div>
                    <div className="pl-2 space-y-1">
                      <div><span className="text-orange-600 dark:text-orange-400">1.</span> Incline DB Press</div>
                      <div className="text-xs text-muted-foreground pl-3">
                        → "Targets weak upper chest while fresh"
                      </div>
                      <div className="text-xs text-muted-foreground pl-3">
                        → Sets: 3 × 8-12 @ RIR 1-2
                      </div>
                    </div>

                    <div className="pt-2 text-green-600 dark:text-green-400">// Insight-Influenced Changes:</div>
                    <div className="pl-2 text-xs space-y-1">
                      <div className="text-red-400">✗ Dips (avoided)</div>
                      <div className="text-muted-foreground pl-3">
                        Reason: "Active warning for shoulder pain"
                      </div>
                      <div className="text-green-400">✓ Cable Flyes (substituted)</div>
                      <div className="text-muted-foreground pl-3">
                        Reason: "Joint-friendly alternative for chest isolation"
                      </div>
                    </div>

                    <div className="pt-2 text-green-600 dark:text-green-400">// Technical Cues:</div>
                    <div className="pl-2 text-xs text-muted-foreground">
                      ["Semi-bent arms throughout", "Squeeze at stretch"]
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>Considers: 8+ variables</span>
                  <span>Reasoning model: GPT-5</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Example 2: Progression Calculator */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-2 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      Load Navigator
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Navigates your loads in real-time, set-by-set · AI Agent
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Previous Set */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">PREVIOUS SET PERFORMANCE:</div>
                  <div className="bg-muted rounded-md p-3 text-sm font-mono space-y-1">
                    <div><span className="text-primary-600 dark:text-primary-400">exercise:</span> "Barbell Bench Press"</div>
                    <div><span className="text-primary-600 dark:text-primary-400">weight:</span> 100kg</div>
                    <div><span className="text-primary-600 dark:text-primary-400">reps:</span> 12 (top of range)</div>
                    <div><span className="text-primary-600 dark:text-primary-400">RIR:</span> 1 (close to failure)</div>
                    <div><span className="text-primary-600 dark:text-primary-400">mentalReadiness:</span> 4/5 (good)</div>
                  </div>
                </div>

                {/* AI Decision Process */}
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">AI reasoning...</span>
                  </div>
                </div>

                {/* Next Set Suggestion */}
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">NEXT SET SUGGESTION:</div>
                  <div className="bg-background rounded-md p-3 text-sm font-mono space-y-2 border border-primary-300 dark:border-primary-700">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">102.5kg</span>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">8 reps</span>
                      <span className="text-muted-foreground">@</span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">RIR 1-2</span>
                    </div>

                    <div className="pt-2 border-t text-xs space-y-1">
                      <div className="text-green-600 dark:text-green-400">// Reasoning:</div>
                      <div className="text-muted-foreground pl-2 space-y-1">
                        <div>✓ Hit top of rep range (12) with RIR 1</div>
                        <div>✓ Mental readiness is high (4/5)</div>
                        <div>✓ Accumulation phase → weight increase</div>
                        <div>✓ Increment: +2.5kg (standard for barbell)</div>
                        <div>✓ Target reps: 8 (bottom of 8-12 range)</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t text-xs">
                      <div className="text-green-600 dark:text-green-400">// Technical Focus:</div>
                      <div className="text-muted-foreground pl-2">
                        "Controlled descent, explosive press"
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>Decision factors: 6+</span>
                  <span>Response: &lt;500ms</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Example 3: Insights & Safety Integration */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="border-2 border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Safety-First: Insights Integration
                </CardTitle>
                <CardDescription>
                  Every AI agent reads active insights and adapts automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Detection */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">1. DETECTION</div>
                    <div className="bg-background rounded-md p-3 text-xs font-mono border">
                      <div className="text-orange-600 dark:text-orange-400 mb-1">insight: {`{`}</div>
                      <div className="pl-2 space-y-0.5 text-muted-foreground">
                        <div>type: "pain",</div>
                        <div>severity: "warning",</div>
                        <div>exercise: "French Press",</div>
                        <div>affected: ["elbow"]</div>
                      </div>
                      <div className="text-orange-600 dark:text-orange-400">{`}`}</div>
                    </div>
                  </div>

                  {/* Learning */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">2. LEARNING</div>
                    <div className="bg-background rounded-md p-3 text-xs font-mono border">
                      <div className="text-green-600 dark:text-green-400 mb-1">memory: {`{`}</div>
                      <div className="pl-2 space-y-0.5 text-muted-foreground">
                        <div>pattern: "substitution",</div>
                        <div>prefers: "Cable Pushdown",</div>
                        <div>over: "French Press",</div>
                        <div>confidence: 0.85,</div>
                        <div>occurrences: 5</div>
                      </div>
                      <div className="text-green-600 dark:text-green-400">{`}`}</div>
                    </div>
                  </div>

                  {/* Application */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">3. APPLICATION</div>
                    <div className="bg-background rounded-md p-3 text-xs space-y-2 border">
                      <div className="font-mono">
                        <div className="text-blue-600 dark:text-blue-400">ExerciseSelector:</div>
                        <div className="text-muted-foreground pl-2">Suggests Cable Pushdown</div>
                      </div>
                      <div className="font-mono">
                        <div className="text-blue-600 dark:text-blue-400">ProgressionCalc:</div>
                        <div className="text-muted-foreground pl-2">Conservative load</div>
                      </div>
                      <div className="font-mono">
                        <div className="text-blue-600 dark:text-blue-400">SubstitutionAgent:</div>
                        <div className="text-muted-foreground pl-2">Validates alternatives</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-950/40 rounded-md text-xs text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-800">
                  <strong>Zero configuration required.</strong> The system learns from your behavior and protects you automatically.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
