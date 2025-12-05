import { getUser } from "@/lib/utils/auth.server";
import type { Metadata } from "next";
import { PublicNavbar } from "@/components/features/landing/public-navbar";
import { HeroSectionGym } from "@/components/features/landing-gym/hero-section-gym";
import { PainPointGym } from "@/components/features/landing-gym/pain-point-gym";
import { WhiteLabelShowcase } from "@/components/features/landing-gym/white-label-showcase";
import { MemberExperience } from "@/components/features/landing-gym/member-experience";
import { BookingShowcase } from "@/components/features/landing-gym/booking-showcase";
import { AIValueGym } from "@/components/features/landing-gym/ai-value-gym";
import { GymComparison } from "@/components/features/landing-gym/gym-comparison";
import { GymPricing } from "@/components/features/landing-gym/gym-pricing";
import { GymFAQ } from "@/components/features/landing-gym/gym-faq";
import { GymCTA } from "@/components/features/landing-gym/gym-cta";
import { Footer } from "@/components/features/landing/footer";
import { FAQSchema } from "@/components/seo/faq-schema";

const gymFAQs = [
  {
    question: "How long does setup take?",
    answer: "5 minutes. Upload your logo, set your colors, share your registration link. Members can start immediately.",
  },
  {
    question: "Do members need to pay for the app?",
    answer: "No. Your subscription covers member access. You decide if/how to charge your members for gym membership.",
  },
  {
    question: "Can I customize the AI workout parameters?",
    answer: "Yes. Set default methodologies, volume targets, equipment availability, and more at the gym level or per-member.",
  },
  {
    question: "How do members join my gym?",
    answer: "Two ways: a branded URL (arvo.guru/join/gym/your-name) or a 6-character invite code they enter in the app.",
  },
  {
    question: "Can I have multiple staff members?",
    answer: "Yes. Add coaches and managers with granular permissions. Each can manage assigned members.",
  },
  {
    question: "Is member data secure?",
    answer: "100%. GDPR compliant, encrypted data, no third-party sharing. Your members' data belongs to you.",
  },
  {
    question: "Can members use the app offline?",
    answer: "Yes. Workouts sync when online. Perfect for gyms with spotty WiFi.",
  },
  {
    question: "What happens to members if I cancel?",
    answer: "Members keep their workout history. They can export data or continue with a personal Arvo account.",
  },
  {
    question: "How does the AI booking system work?",
    answer: "Coaches can book sessions with natural language like \"Book Marco Tuesday at 6pm\". The AI understands, checks availability, and schedules automatically. Confirmations and reminders are sent without any manual work.",
  },
];

export const metadata: Metadata = {
  title: "Arvo for Gym Owners - White Label Fitness App with AI Workouts",
  description: "Launch your branded gym app in 5 minutes. AI generates personalized workouts for every member. White-label, zero development. Mindbody & Glofox alternative.",
  keywords: [
    'gym management software',
    'white label fitness app',
    'gym owner software',
    'gym member retention software',
    'branded fitness app for gyms',
    'mindbody alternative',
    'glofox alternative',
    'virtuagym alternative',
    'gym app for members',
    'AI workout generator for gyms',
    'AI booking system for gyms',
    'gym appointment scheduling',
    'personal trainer booking software',
    'software gestionale palestra',
    'app palestra personalizzata',
    'gestione membri palestra',
    'app fitness white label',
    'prenotazione sessioni palestra',
  ],

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru/for-gyms',
    title: 'Arvo for Gym Owners - White Label Fitness App with AI Workouts',
    description: 'Launch your branded gym app in 5 minutes. AI generates personalized workouts for every member. White-label, zero development.',
    siteName: 'Arvo',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Arvo for Gym Owners - White Label Fitness App',
    description: 'Your branded gym app in 5 minutes. AI workouts for every member. Zero development.',
  },

  alternates: {
    canonical: 'https://arvo.guru/for-gyms',
  },
};

export default async function ForGymsPage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  const showWaitlist = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true';

  return (
    <>
      <FAQSchema faqs={gymFAQs} />
      <main className="min-h-screen">
        <PublicNavbar isAuthenticated={isAuthenticated} />
        <HeroSectionGym isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
        <PainPointGym />
        <WhiteLabelShowcase />
        <MemberExperience />
        <BookingShowcase />
        <AIValueGym />
        <GymComparison />
        <GymPricing />
        <GymFAQ />
        <GymCTA isAuthenticated={isAuthenticated} showWaitlist={showWaitlist} />
        <Footer />
      </main>
    </>
  );
}
