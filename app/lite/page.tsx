import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { HeroSectionSimple } from "@/components/features/landing-simple/hero-section-simple";
import { WhoIsArvoFor } from "@/components/features/landing/who-is-arvo-for";
import { SimpleShowcase } from "@/components/features/landing-simple/simple-showcase";
import { SimpleResults } from "@/components/features/landing-simple/simple-results";
import { AutoProgression } from "@/components/features/landing-simple/auto-progression";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";
import { FAQSchema } from "@/components/seo/faq-schema";

const liteFAQs = [
  {
    question: "Do I need gym experience to use Arvo Lite?",
    answer: "No experience needed. Arvo Lite is designed for beginners. The AI creates complete workouts for you and guides you through every exercise with clear instructions.",
  },
  {
    question: "Does Arvo work offline in the gym?",
    answer: "Yes, completely. All AI decisions run locally. No internet required during workouts. Data syncs automatically when you're back online.",
  },
  {
    question: "What equipment do I need?",
    answer: "During onboarding, you tell Arvo what equipment you have access to. It creates workouts using only your available equipment - whether it's a full gym or just dumbbells at home.",
  },
  {
    question: "How does the AI know what weight to suggest?",
    answer: "Arvo learns from every set you complete. It tracks your progress and suggests weights based on your actual performance, gradually increasing as you get stronger.",
  },
  {
    question: "Is my training data private?",
    answer: "100% yours. Export anytime. Privacy-first design: no data selling, no third-party analytics. Your training history belongs to you completely.",
  },
  {
    question: "How much does Arvo Lite cost?",
    answer: "Free during beta. No credit card required. Just sign up with your email and start training immediately.",
  },
];

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
    <>
      <FAQSchema faqs={liteFAQs} />
      <main className="min-h-screen">
        <PublicNavbar isAuthenticated={isAuthenticated} />
      <HeroSectionSimple isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <WhoIsArvoFor variant="simple" />
      <SimpleShowcase />
      <SimpleResults />
      <AutoProgression />
      <FAQSection variant="simple" />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
      </main>
    </>
  );
}
