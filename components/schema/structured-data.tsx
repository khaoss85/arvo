import { locales } from '@/i18n';

/**
 * StructuredData component that renders JSON-LD schema markup for SEO
 * Defines Arvo as both a WebSite and SoftwareApplication
 */
export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // WebSite Schema
      {
        '@type': 'WebSite',
        '@id': 'https://arvo.guru/#website',
        name: 'Arvo',
        alternateName: 'Arvo - AI Personal Trainer App for Gym',
        url: 'https://arvo.guru',
        description:
          'AI personal trainer app for gym. AI workout coach with set-by-set progression, optimized for advanced methods (Kuba, Mentzer, FST-7). Real-time AI coaching for bodybuilding.',
        inLanguage: locales,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://arvo.guru/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        keywords: [
          'AI personal trainer app for gym',
          'AI workout coach for bodybuilding',
          'AI coach with set-by-set progression',
          'Kuba method app',
          'Mentzer HIT training app',
          'FST-7 workout app',
        ],
      },
      // SoftwareApplication Schema
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://arvo.guru/#softwareapplication',
        name: 'Arvo',
        url: 'https://arvo.guru',
        applicationCategory: 'HealthAndFitnessApplication',
        applicationSubCategory: 'AI Personal Trainer',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        description:
          'AI personal trainer app for gym. AI workout coach with set-by-set progression for intermediate and advanced lifters. Features Kuba Method, Mentzer HIT, FST-7 methodology implementations.',
        featureList: [
          'AI Personal Trainer',
          'AI Workout Coach',
          'Set-by-Set Progression',
          'Kuba Method Training',
          'Mentzer HIT Training',
          'FST-7 Training',
          'MEV/MAV/MRV Volume Tracking',
          'Progressive Overload Tracking',
          'AI Coaching Recommendations',
          'Custom Workout Splits',
          'Performance Analytics',
        ],
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          category: 'Free',
        },
        screenshot: 'https://arvo.guru/og-image.png',
        softwareVersion: '1.0',
        author: {
          '@type': 'Organization',
          name: 'Arvo',
          url: 'https://arvo.guru',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5',
          ratingCount: '1',
        },
      },
      // Organization Schema
      {
        '@type': 'Organization',
        '@id': 'https://arvo.guru/#organization',
        name: 'Arvo',
        url: 'https://arvo.guru',
        logo: {
          '@type': 'ImageObject',
          url: 'https://arvo.guru/logo.png',
        },
        sameAs: [],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
