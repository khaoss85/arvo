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
    default: 'Arvo - AI Personal Trainer App for Gym',
    template: '%s | Arvo',
  },
  description: 'AI personal trainer app for gym. AI workout coach with set-by-set progression, optimized for advanced methods (Kuba, Mentzer, FST-7). Real-time AI coaching for bodybuilding and strength training.',
  keywords: [
    'AI personal trainer app for gym',
    'AI workout coach for bodybuilding',
    'AI coach with set-by-set progression',
    'AI gym trainer',
    'AI fitness coach',
    'AI bodybuilding coach',
    'Kuba method app',
    'Mentzer HIT training app',
    'FST-7 workout app',
    'workout tracker',
    'training program',
    'fitness app',
    'strength training',
    'progressive overload',
    'workout planner'
  ],
  authors: [{ name: 'Arvo' }],
  creator: 'Arvo',
  publisher: 'Arvo',

  // OpenGraph for social sharing (Facebook, LinkedIn, etc.)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arvo.guru',
    title: 'Arvo - AI Personal Trainer App for Gym',
    description: 'AI personal trainer app for gym. AI workout coach with set-by-set progression, optimized for Kuba, Mentzer, FST-7 methods.',
    siteName: 'Arvo',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Arvo - AI Personal Trainer App for Gym',
    description: 'AI personal trainer app for gym. AI workout coach with set-by-set progression, optimized for Kuba, Mentzer, FST-7 methods.',
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
  // Enable safe-area-inset for iOS notch/home indicator
  viewportFit: 'cover',
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
