import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { HeroSectionCoach } from "@/components/features/landing-coach/hero-section-coach";
import { PainPointSection } from "@/components/features/landing-coach/pain-point-section";
import { AIGenerationShowcase } from "@/components/features/landing-coach/ai-generation-showcase";
import { ClientDashboardPreview } from "@/components/features/landing-coach/client-dashboard-preview";
import { ProgressMonitoringSection } from "@/components/features/landing-coach/progress-monitoring-section";
import { InterfaceModesSection } from "@/components/features/landing-coach/interface-modes-section";
import { CoachComparison } from "@/components/features/landing-coach/coach-comparison";
import { GettingStartedSection } from "@/components/features/landing-coach/getting-started-section";
import { CoachFAQ } from "@/components/features/landing-coach/coach-faq";
import { CoachCTA } from "@/components/features/landing-coach/coach-cta";
import { Footer } from "@/components/features/landing/footer";
import { FAQSchema } from "@/components/seo/faq-schema";

const coachFAQs = [
  {
    question: "How do I invite clients?",
    answer: "Share your unique coach link or code. Clients create an account and are automatically linked to you. You can also send direct invitations via email from the dashboard.",
  },
  {
    question: "Do clients pay separately?",
    answer: "Clients get free access when linked to your coach account. Your subscription covers their app access. You bill clients separately for your coaching services.",
  },
  {
    question: "Can I customize AI-generated workouts?",
    answer: "Absolutely. Every workout goes through you first. Add exercises, adjust volumes, change split - you have full control before the client sees anything.",
  },
  {
    question: "How do I see client progress?",
    answer: "The Coach Dashboard shows all clients at a glance. Click any client to see their Check Room photos, workout history, volume graphs, and all logged data.",
  },
  {
    question: "Can clients switch to another coach?",
    answer: "Yes, clients can unlink anytime. Their workout history stays with them. You can also release clients from your dashboard.",
  },
  {
    question: "Is there a client limit?",
    answer: "The Coach plan supports up to 50 active clients. Need more? Contact us for enterprise solutions.",
  },
];

export const metadata: Metadata = {
  title: "Arvo for Personal Trainers - AI Workout Generation & Client Management",
  description: "Stop working weekends writing workout plans. Arvo's AI generates personalized programs in seconds. You approve, clients train, everything tracked. Free trial.",
  keywords: [
    'personal trainer software',
    'AI workout generator for coaches',
    'client management for trainers',
    'workout plan software',
    'fitness coach app',
    'PT client tracking',
    'gym management software',
    'online coaching platform',
    'personal training app',
    'fitness coaching software',
  ],

  // OpenGraph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/for-trainers',
    title: 'Arvo for Personal Trainers - AI Workout Generation & Client Management',
    description: 'Stop working weekends writing workout plans. AI generates personalized programs. You approve, clients train, everything tracked.',
    siteName: 'Arvo',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Arvo for Personal Trainers - AI Workout Generation',
    description: 'Stop working weekends. AI generates workout plans. You approve. Clients train. Everything tracked.',
  },

  // Canonical URL
  alternates: {
    canonical: 'https://arvo.guru/for-trainers',
  },
};

export default async function ForTrainersPage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  // Check if waitlist mode is enabled via env variable
  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <>
      <FAQSchema faqs={coachFAQs} />
      <main className="min-h-screen">
        <PublicNavbar isAuthenticated={isAuthenticated} />
        <HeroSectionCoach isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
        <PainPointSection />
        <AIGenerationShowcase />
        <ClientDashboardPreview />
        <ProgressMonitoringSection />
        <InterfaceModesSection />
        <CoachComparison />
        <GettingStartedSection />
        <CoachFAQ />
        <CoachCTA isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
        <Footer />
      </main>
    </>
  );
}
