import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { HeroSectionSimple } from "@/components/features/landing-simple/hero-section-simple";
import { SimpleShowcase } from "@/components/features/landing-simple/simple-showcase";
import { SimpleResults } from "@/components/features/landing-simple/simple-results";
import { AutoProgression } from "@/components/features/landing-simple/auto-progression";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";

export const metadata: Metadata = {
  title: "Arvo Lite - Simple Workout Tracking Without the Complexity",
  description: "Track your workouts without overthinking. No periodization, no complicated metrics. Just you, your exercises, and steady progress. Perfect for beginners and those who want simplicity.",
  keywords: [
    'simple workout tracker',
    'easy gym app',
    'beginner workout app',
    'workout log',
    'exercise tracker',
    'fitness app for beginners',
    'simple fitness tracker',
    'no-nonsense workout app',
    'minimalist gym tracker',
    'workout diary',
  ],

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/lite',
    title: 'Arvo Lite - Simple Workout Tracking Without the Complexity',
    description: 'Track your workouts without overthinking. No periodization, no complicated metrics. Just you, your exercises, and steady progress.',
    siteName: 'Arvo',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Arvo Lite - Simple Workout Tracking Without the Complexity',
    description: 'Track your workouts without overthinking. No periodization, no complicated metrics. Just you, your exercises, and steady progress.',
  },

  alternates: {
    canonical: 'https://arvo.guru/lite',
  },
};

export default async function LitePage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <main className="min-h-screen">
      <HeroSectionSimple isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <SimpleShowcase />
      <SimpleResults />
      <AutoProgression />
      <FAQSection variant="simple" />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
    </main>
  );
}
