import { getUser } from "@/lib/utils/auth.server";
import { redirect } from "next/navigation";
import { WaitlistForm } from "@/components/features/landing/waitlist-form";
import { Sparkles, Users, Zap, Gift, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist - ARVO AI Training",
  description: "Be among the first to experience AI-powered training. Get early access, skip the line by inviting friends, and unlock premium features.",
};

export default async function WaitlistPage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  // Check if waitlist is enabled
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  // If waitlist is disabled or user is authenticated, redirect to appropriate page
  if (!showWaitlist || isAuthenticated) {
    redirect(isAuthenticated ? "/dashboard" : "/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-primary-50/30 to-background dark:from-background dark:via-primary-950/10 dark:to-background">
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-200 dark:border-primary-800">
              <Sparkles className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold">
            Join the{" "}
            <span className="bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
              ARVO Waitlist
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Be among the first to experience AI-powered training that adapts to your methodology,
            tracks your progress, and coaches you through every set.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Early Access</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to experience AI coaching with Kuba Cielen, Mike Mentzer, and FST-7 methodologies.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Skip the Line</h3>
            <p className="text-sm text-muted-foreground">
              Invite 3 friends to jump to top 50. Invite 5 friends for instant access. Simple.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Premium Features</h3>
            <p className="text-sm text-muted-foreground">
              Unlock audio coaching, biomechanics AI, and advanced volume tracking before everyone else.
            </p>
          </div>
        </div>

        {/* Waitlist Form */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <WaitlistForm />
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Join the Waitlist</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your email and get your unique referral link instantly.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Share Your Link</h3>
                <p className="text-sm text-muted-foreground">
                  Invite friends who are serious about training. They get early access, you move up.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get Access</h3>
                <p className="text-sm text-muted-foreground">
                  3 friends = top 50 in queue. 5 friends = instant access. Start training with AI.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
