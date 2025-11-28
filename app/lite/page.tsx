import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { HeroSectionSimple } from "@/components/features/landing-simple/hero-section-simple";
import { WhoIsArvoFor } from "@/components/features/landing/who-is-arvo-for";
import { SimpleShowcase } from "@/components/features/landing-simple/simple-showcase";
import { SimpleResults } from "@/components/features/landing-simple/simple-results";
import { AutoProgression } from "@/components/features/landing-simple/auto-progression";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";

export const metadata: Metadata = {
  title: "Arvo Lite - AI Personal Trainer for Beginners",
  description: "AI personal trainer for beginners. Simple AI gym coach that does everything for you. No experience needed - just show up and follow the app. AI workout app without complexity.",
  keywords: [
    'AI personal trainer for beginners',
    'AI gym coach simple',
    'AI workout app no experience needed',
    'beginner AI fitness coach',
    'simple AI workout app',
    'easy AI gym app',
    'AI trainer for beginners',
    'simple workout tracker',
    'easy gym app',
    'beginner workout app',
    'workout log',
    'exercise tracker',
    'fitness app for beginners',
    'simple fitness tracker',
    'minimalist gym tracker',
  ],

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/lite',
    title: 'Arvo Lite - AI Personal Trainer for Beginners',
    description: 'AI personal trainer for beginners. Simple AI gym coach that does everything for you. No experience needed - just show up and follow the app.',
    siteName: 'Arvo',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Arvo Lite - AI Personal Trainer for Beginners',
    description: 'AI personal trainer for beginners. Simple AI gym coach that does everything for you. No experience needed.',
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
      <WhoIsArvoFor variant="simple" />
      <SimpleShowcase />
      <SimpleResults />
      <AutoProgression />
      <FAQSection variant="simple" />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
    </main>
  );
}
