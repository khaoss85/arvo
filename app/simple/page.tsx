import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { HeroSectionSimple } from "@/components/features/landing-simple/hero-section-simple";
import { SimpleShowcase } from "@/components/features/landing-simple/simple-showcase";
import { AutoProgression } from "@/components/features/landing-simple/auto-progression";
import { SimpleResults } from "@/components/features/landing-simple/simple-results";
import { SmartRestTimer } from "@/components/features/landing/smart-rest-timer";
import { NotesIntelligence } from "@/components/features/landing/notes-intelligence";
import { MethodologiesSection } from "@/components/features/landing/methodologies-section";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";

export const metadata: Metadata = {
  title: "Arvo - The App That Thinks For You",
  description: "Nothing to study. Nothing to decide. Just results. Start in 3 minutes with zero complications. The simplest AI-powered workout tracker for casual gym-goers and beginners.",
  keywords: [
    'simple workout tracker',
    'beginner fitness app',
    'easy gym tracker',
    'AI workout app',
    'casual gym app',
    'simple training app',
    'automatic workout planner',
    'beginner bodybuilding',
    'easy fitness tracker',
    'no-thinking workout app',
    'progressive overload automation',
    'smart rest timer',
  ],

  // OpenGraph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/simple',
    title: 'Arvo - The App That Thinks For You',
    description: 'Nothing to study. Nothing to decide. Just results. The simplest AI-powered workout tracker for casual gym-goers and beginners.',
    siteName: 'Arvo',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Arvo - The App That Thinks For You',
    description: 'Nothing to study. Nothing to decide. Just results. Start in 3 minutes with zero complications.',
  },

  // Canonical URL
  alternates: {
    canonical: 'https://arvo.guru/simple',
  },
};

export default async function SimplePage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  // Check if waitlist mode is enabled via env variable
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <main className="min-h-screen">
      <HeroSectionSimple isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <SimpleShowcase />
      <AutoProgression />
      <SmartRestTimer />
      <NotesIntelligence />
      <SimpleResults />
      <MethodologiesSection />
      <FAQSection />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
    </main>
  );
}
