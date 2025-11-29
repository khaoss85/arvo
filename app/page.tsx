import type { Metadata } from "next";
import { getUser } from "@/lib/utils/auth.server";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { HeroSection } from "@/components/features/landing/hero-section";

export const metadata: Metadata = {
  title: "Arvo - AI Personal Trainer | Real-Time Workout Coaching",
  description: "AI personal trainer that adapts every set in real-time. 19 specialized agents for progressive overload, fatigue management, and evidence-based training. Kuba, Mentzer, FST-7 methodologies. Free during beta.",
  keywords: [
    'AI personal trainer',
    'AI workout coach',
    'AI fitness app',
    'real-time workout adaptation',
    'progressive overload app',
    'set-by-set progression',
    'AI gym coach',
    'smart workout tracker',
    'Kuba method app',
    'Mentzer HIT app',
    'FST-7 workout app',
    'MEV MAV MRV tracking',
    'RIR RPE workout tracker',
    'evidence-based training app',
  ],

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru',
    title: 'Arvo - AI Personal Trainer | Real-Time Workout Coaching',
    description: 'AI personal trainer that adapts every set in real-time. 19 specialized agents. Progressive overload. Kuba, Mentzer, FST-7 methodologies.',
    siteName: 'Arvo',
    images: [
      {
        url: 'https://arvo.guru/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Arvo - AI Personal Trainer',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Arvo - AI Personal Trainer | Real-Time Workout Coaching',
    description: 'AI that adapts every set in real-time. 19 specialized agents. Progressive overload.',
    images: ['https://arvo.guru/og-image.png'],
  },

  alternates: {
    canonical: 'https://arvo.guru',
  },
};
import { WhoIsArvoFor } from "@/components/features/landing/who-is-arvo-for";
import { AIShowcase } from "@/components/features/landing/ai-showcase";
import { SmartRestTimer } from "@/components/features/landing/smart-rest-timer";
import { NotesIntelligence } from "@/components/features/landing/notes-intelligence";
import { VolumeTrackingVisual } from "@/components/features/landing/volume-tracking-visual";
import { CheckRoomSection } from "@/components/features/landing/CheckRoomSection";
import { RadarChartSection } from "@/components/features/landing/RadarChartSection";
import { BiomechanicsDemo } from "@/components/features/landing/biomechanics-demo";
import { GymReadyFeatures } from "@/components/features/landing/gym-ready-features";
import { AICoachingFeatures } from "@/components/features/landing/ai-coaching-features";
import { EquipmentVision } from "@/components/features/landing/equipment-vision";
import { MethodologiesSection } from "@/components/features/landing/methodologies-section";
import { ComparisonTable } from "@/components/features/landing/comparison-table";
import { FAQSection } from "@/components/features/landing/faq-section";
import { CTASection } from "@/components/features/landing/cta-section";
import { Footer } from "@/components/features/landing/footer";
import { FAQSchema } from "@/components/seo/faq-schema";

const homepageFAQs = [
  {
    question: "Does Arvo work offline in the gym?",
    answer: "Yes, completely. All AI decisions run locally with cached models. No internet required during workouts. Data syncs automatically when you're back online. Wake Lock keeps screen on, so you never have to unlock your phone between sets.",
  },
  {
    question: "Can I add my own custom equipment?",
    answer: "Absolutely. Got a specialty machine your gym has? Custom cable attachment? Add it once with a name and example exercises. The AI will suggest exercises for your custom equipment in future workouts.",
  },
  {
    question: "What if I get injured or have pain?",
    answer: "The Insights system automatically detects patterns. Log pain once on an exercise? It notes it. Twice? Creates an insight with severity level. Three times? Automatically avoids that exercise and suggests alternatives.",
  },
  {
    question: "How does the AI learn my preferences?",
    answer: "Three ways: Pattern detection (you substitute Exercise A with B 3+ times), Notes extraction (write 'loved this exercise'), and Behavioral signals (high mental readiness on certain movements). All automatic, zero manual tagging.",
  },
  {
    question: "How is Arvo different from an Excel spreadsheet?",
    answer: "Excel gives you control but zero intelligence. Arvo automates everything with AI: set-by-set progression in under 500ms, volume tracking vs MEV/MAV/MRV, automatic deload triggers, and biomechanical weight adjustments.",
  },
  {
    question: "Is my training data mine? Can I export it?",
    answer: "100% yours. Export anytime to JSON/CSV. Privacy-first design: no data selling, no third-party analytics. Your training history belongs to you completely.",
  },
  {
    question: "How much does Arvo cost?",
    answer: "Free to start during beta. Passwordless magic link authentication, no credit card required. Core features are available immediately. The goal is to make intelligent training accessible.",
  },
];

export default async function Home() {
  const user = await getUser();
  const isAuthenticated = !!user;

  // Check if waitlist mode is enabled via env variable
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <>
      <FAQSchema faqs={homepageFAQs} />
      <main className="min-h-screen">
        <PublicNavbar isAuthenticated={isAuthenticated} />
      <HeroSection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <WhoIsArvoFor variant="default" />
      <AIShowcase />
      <SmartRestTimer />
      <NotesIntelligence />
      <VolumeTrackingVisual />
      <CheckRoomSection variant="default" />
      <RadarChartSection variant="default" />
      <BiomechanicsDemo />
      <GymReadyFeatures />
      <AICoachingFeatures />
      <EquipmentVision />
      <MethodologiesSection />
      <ComparisonTable />
      <FAQSection />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
      </main>
    </>
  );
}
