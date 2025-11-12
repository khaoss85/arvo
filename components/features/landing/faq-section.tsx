'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Does it work offline in the gym?",
      answer: "Yes, completely. All AI decisions run locally with cached models. No internet required during workouts. Data syncs automatically when you're back online. Wake Lock keeps screen on, so you never have to unlock your phone between sets.",
    },
    {
      question: "Can I add my own custom equipment?",
      answer: "Absolutely. Got a specialty machine your gym has? Custom cable attachment? Add it once with a name and example exercises. The AI will suggest exercises for your custom equipment in future workouts. It's in the equipment database permanently.",
    },
    {
      question: "What if I get injured or have pain?",
      answer: "The Insights system automatically detects patterns. Log pain once on French Press? It notes it. Twice? Creates an insight with severity level. Three times? Automatically avoids that exercise and suggests alternatives. Every AI agent reads active insights and adapts decisions accordingly. Zero configuration required.",
    },
    {
      question: "How does the AI learn my preferences?",
      answer: "Three ways: 1) Pattern detection (you substitute Exercise A with B 3+ times → learns preference), 2) Notes extraction (write 'loved this exercise' at end of workout → creates positive memory with NLP), 3) Behavioral signals (consistently high mental readiness on certain movements → confidence boost). All automatic, zero manual tagging. Just write honest feedback and the Pattern Scout agent extracts insights.",
    },
    {
      question: "How is this different from an Excel spreadsheet?",
      answer: "Excel gives you control but zero intelligence. You manually calculate next weight, track volume, decide when to deload. Arvo automates all of it with AI reasoning: set-by-set progression suggestions in <500ms, volume tracking vs MEV/MAV/MRV, automatic deload triggers, biomechanical weight adjustments for exercise swaps, pattern learning from your preferences. Excel is static. Arvo adapts.",
    },
    {
      question: "Is my training data mine? Can I export it?",
      answer: "100% yours. Export anytime to JSON/CSV. Privacy-first design: no data selling, no third-party analytics tracking your workouts. Your training history belongs to you. Supabase backend with row-level security. You own your data completely.",
    },
    {
      question: "How much does it cost?",
      answer: "Free to start. Passwordless magic link authentication, no credit card required. Core features (AI workout generation, progression tracking, insights, custom equipment) are available immediately. The goal is to make intelligent training accessible, not to gatekeep behind paywalls.",
    },
  ];

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
            Questions?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The 6 questions everyone asks before trying a new training app.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
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
                      {faq.question}
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
                          {faq.answer}
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
            Still have questions?{" "}
            <a
              href="mailto:support@arvo.guru"
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              support@arvo.guru
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
