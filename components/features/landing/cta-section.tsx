'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTASectionProps {
  isAuthenticated: boolean;
}

export function CTASection({ isAuthenticated }: CTASectionProps) {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-primary-50 dark:to-primary-950/20">
      <div className="container max-w-4xl mx-auto">
        <motion.div
          className="text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Train{" "}
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
                Smarter?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join athletes using AI-powered training. Complete your first AI-generated workout in minutes.
            </p>
          </div>

          {/* Features Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <div className="px-4 py-2 rounded-full bg-background border border-border">
              ✓ 5-minute onboarding
            </div>
            <div className="px-4 py-2 rounded-full bg-background border border-border">
              ✓ Instant workout generation
            </div>
            <div className="px-4 py-2 rounded-full bg-background border border-border">
              ✓ Free to start
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              <Button size="lg" className="text-base px-8 h-12 group">
                {isAuthenticated ? "Go to Dashboard" : "Start Your First Workout"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Technical Note */}
          <p className="text-xs text-muted-foreground/70 max-w-2xl mx-auto">
            No credit card required. Passwordless magic link authentication.
            <br />
            Your data is yours. Privacy-first design.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
