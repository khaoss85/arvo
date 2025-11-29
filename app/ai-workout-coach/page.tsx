import type { Metadata } from "next";
import { getUser } from "@/lib/utils/auth.server";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { HeroSection } from "@/components/features/landing/hero-section";
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
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";

const aiWorkoutCoachFAQs = [
  {
    question: "What makes Arvo different from other AI workout coaches?",
    answer: "Arvo uses 19 specialized AI agents working together, not a single generic model. Each agent handles specific tasks: progression, fatigue, volume tracking, injury detection. Real set-by-set decisions in under 500ms. RIR/RPE-aware with biomechanical weight adjustments.",
  },
  {
    question: "Is Arvo better than Fitbod for serious lifters?",
    answer: "For serious gym lifters, yes. Fitbod uses simple algorithms. Arvo implements actual training methodologies: Kuba Method, Mentzer HIT, FST-7 with scientific fidelity. MEV/MAV/MRV volume tracking, plateau detection, and exercise rotation based on your history.",
  },
  {
    question: "How does AI workout coaching work during my gym session?",
    answer: "After each set, Arvo analyzes your performance and suggests the next set's weight and reps. The AI considers your RIR, accumulated fatigue, exercise history, and training methodology. All decisions happen locally - no internet required in the gym.",
  },
  {
    question: "Can the AI workout coach handle bodybuilding and powerbuilding?",
    answer: "Absolutely. Arvo supports both bodybuilding (hypertrophy-focused) and powerbuilding (strength + size). The AI adjusts rep ranges, rest periods, and progression based on your goals. Track volume landmarks and strength PRs simultaneously.",
  },
  {
    question: "What RIR and RPE features does the AI coach include?",
    answer: "Full RIR/RPE integration. Log your perceived exertion, and the AI uses it for progression decisions. Tracks RIR trends over time, detects when you're sandbagging or overreaching. Methodology-specific RIR targets (Kuba uses 1-3 RIR, Mentzer uses 0 RIR to failure).",
  },
  {
    question: "Does the AI workout coach work offline in the gym?",
    answer: "Yes, completely offline. All AI decisions run locally with cached models. No internet required during workouts. Wake Lock keeps your screen on between sets. Data syncs automatically when you're back online.",
  },
  {
    question: "How much does the AI workout coach cost?",
    answer: "Free to start during beta. Passwordless magic link authentication, no credit card required. Core features available immediately. The goal is to make intelligent training accessible to all serious lifters.",
  },
];

export const metadata: Metadata = {
  title: "AI Workout Coach for Gym - Arvo",
  description: "AI workout coach for serious gym lifters. Real set-by-set progression, RIR/RPE tracking, Kuba & Mentzer methods. Better than Fitbod, Freeletics, Strong. 19 specialized AI agents for intelligent training.",
  keywords: [
    'AI workout coach',
    'AI workout coach for gym',
    'AI personal trainer',
    'AI personal trainer bodybuilding',
    'AI gym coach',
    'workout app for serious lifters',
    'AI fitness coach',
    'gym workout app AI',
    'intelligent workout tracker',
    'set-by-set AI coaching',
    'RIR RPE workout tracker',
    'MEV MAV MRV tracking app',
    'Kuba method app',
    'Mentzer HIT app',
    'FST-7 workout app',
    'Arvo vs Fitbod',
    'Arvo vs Freeletics',
    'Arvo vs Strong',
    'Arvo vs Hevy',
    'bodybuilding AI coach',
    'powerbuilding app',
    'AI training coach',
  ],

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/ai-workout-coach',
    title: 'AI Workout Coach for Gym - Arvo',
    description: 'AI workout coach for serious gym lifters. Real set-by-set progression, RIR/RPE tracking, Kuba & Mentzer methods. 19 specialized AI agents.',
    siteName: 'Arvo',
    images: [
      {
        url: 'https://arvo.guru/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Arvo - AI Workout Coach for Gym',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'AI Workout Coach for Gym - Arvo',
    description: 'AI workout coach for serious gym lifters. Real set-by-set progression, RIR/RPE tracking.',
    images: ['https://arvo.guru/og-image.png'],
  },

  alternates: {
    canonical: 'https://arvo.guru/ai-workout-coach',
  },
};

export default async function AIWorkoutCoachPage() {
  const user = await getUser();
  const isAuthenticated = !!user;
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <>
      <FAQSchema faqs={aiWorkoutCoachFAQs} />
      <SoftwareApplicationSchema />
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
