import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { HeroSectionPro } from "@/components/features/landing-pro/hero-section-pro";
import { WhoIsArvoFor } from "@/components/features/landing/who-is-arvo-for";
import { CoachingShowcase } from "@/components/features/landing-pro/coaching-showcase";
import { ProblemSolution } from "@/components/features/landing-pro/problem-solution";
import { SmartRestTimer } from "@/components/features/landing/smart-rest-timer";
import { NotesIntelligence } from "@/components/features/landing/notes-intelligence";
import { VolumeTrackingVisual } from "@/components/features/landing/volume-tracking-visual";
import { RadarChartSection } from "@/components/features/landing/RadarChartSection";
import { CheckRoomSection } from "@/components/features/landing/CheckRoomSection";
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

const proFAQs = [
  {
    question: "Can I use Arvo for contest prep?",
    answer: "Absolutely. Track volume vs MRV week by week, monitor mental readiness trends across your prep, get automatic deload suggestions when fatigue accumulates. Everything you need for structured contest preparation with intelligent volume management.",
  },
  {
    question: "Does Arvo understand periodization?",
    answer: "Yes. Kuba Method has accumulation/intensification/deload phases built in. Mentzer HIT has 4-7 day recovery protocols. The system tracks where you are in your training cycle and adjusts volume, intensity, and frequency accordingly.",
  },
  {
    question: "What if I want to run my own program?",
    answer: "You're not locked into Kuba or Mentzer. Track any program you want. The AI still provides set-by-set progression guidance, injury pattern detection, volume tracking, and biomechanical adjustments with your own programming.",
  },
  {
    question: "Does Arvo work offline in the gym?",
    answer: "Yes, completely. All AI decisions run locally with cached models. No internet required during workouts. Data syncs automatically when you're back online.",
  },
  {
    question: "How does the AI learn my preferences?",
    answer: "Pattern detection (substitute exercises 3+ times), notes extraction (write feedback naturally), and behavioral signals (mental readiness patterns). All automatic, zero manual tagging.",
  },
  {
    question: "Is my training data mine?",
    answer: "100% yours. Export anytime to JSON/CSV. Privacy-first design: no data selling, no third-party analytics. Your training history belongs to you completely.",
  },
];

export const metadata: Metadata = {
  title: "Arvo Pro - AI Workout Coach for Bodybuilding",
  description: "AI workout coach for bodybuilding. AI personal trainer for intermediate and advanced lifters. Train with Kuba Method, Mentzer HIT, FST-7. MEV/MAV/MRV volume tracking, set-by-set AI coaching for serious athletes.",
  keywords: [
    'AI workout coach for bodybuilding',
    'AI personal trainer for advanced lifters',
    'AI bodybuilding program',
    'AI coach for intermediate lifters',
    'IFBB PRO bodybuilding',
    'advanced workout tracker',
    'Kuba Cielen training',
    'Kuba method app',
    'Mike Mentzer HIT',
    'Mentzer HIT training app',
    'FST-7 training',
    'FST-7 workout app',
    'volume tracking MEV MAV MRV',
    'RIR RPE tracking',
    'AI bodybuilding coach',
    'methodology-aware training',
    'elite bodybuilding app',
    'professional bodybuilding tracker',
    'set-by-set coaching',
    'AI gym trainer',
  ],

  // OpenGraph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/pro',
    title: 'Arvo Pro - AI Workout Coach for Bodybuilding',
    description: 'AI workout coach for bodybuilding. AI personal trainer for intermediate and advanced lifters. Kuba Method, Mentzer HIT, FST-7 with set-by-set AI coaching.',
    siteName: 'Arvo',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Arvo Pro - AI Workout Coach for Bodybuilding',
    description: 'AI workout coach for bodybuilding. AI personal trainer for intermediate and advanced lifters. Kuba, Mentzer, FST-7 methodologies.',
  },

  // Canonical URL
  alternates: {
    canonical: 'https://arvo.guru/pro',
  },
};

export default async function ProPage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  // Check if waitlist mode is enabled via env variable
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <>
      <FAQSchema faqs={proFAQs} />
      <main className="min-h-screen">
        <PublicNavbar isAuthenticated={isAuthenticated} />
      <HeroSectionPro isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <WhoIsArvoFor variant="pro" />
      <ProblemSolution />
      <CoachingShowcase />
      <SmartRestTimer />
      <NotesIntelligence />
      <VolumeTrackingVisual />
      <RadarChartSection variant="pro" />
      <CheckRoomSection variant="pro" />
      <BiomechanicsDemo />
      <GymReadyFeatures />
      <AICoachingFeatures />
      <EquipmentVision />
      <MethodologiesSection />
      <ComparisonTable />
      <FAQSection variant="pro" />
      <CTASection isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
      <Footer />
      </main>
    </>
  );
}
