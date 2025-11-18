import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { StructuredData } from "@/components/schema/structured-data";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://arvo.guru'),
  title: {
    default: 'Arvo - Smart Workout Tracker',
    template: '%s | Arvo',
  },
  description: 'Parametric training program builder and workout tracker. Build custom workout splits, track progress, and achieve your fitness goals with AI-powered recommendations.',
  keywords: ['workout tracker', 'training program', 'fitness app', 'strength training', 'workout builder', 'gym tracker', 'progressive overload', 'workout planner'],
  authors: [{ name: 'Arvo' }],
  creator: 'Arvo',
  publisher: 'Arvo',

  // OpenGraph for social sharing (Facebook, LinkedIn, etc.)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru',
    title: 'Arvo - Smart Workout Tracker',
    description: 'Parametric training program builder and workout tracker. Build custom workout splits, track progress, and achieve your fitness goals.',
    siteName: 'Arvo',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Arvo - Smart Workout Tracker',
    description: 'Parametric training program builder and workout tracker. Build custom workout splits, track progress, and achieve your fitness goals.',
  },

  // PWA & Mobile
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Arvo',
  },

  // SEO robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Additional meta tags
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

// Theme colors moved to viewport (Next.js 14 requirement)
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StructuredData />
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
