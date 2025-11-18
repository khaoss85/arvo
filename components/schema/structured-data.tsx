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
        alternateName: 'Arvo - Smart Workout Tracker',
        url: 'https://arvo.guru',
        description:
          'Parametric training program builder and workout tracker. Build custom workout splits, track progress, and achieve your fitness goals with AI-powered recommendations.',
        inLanguage: locales,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://arvo.guru/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      // SoftwareApplication Schema
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://arvo.guru/#softwareapplication',
        name: 'Arvo',
        url: 'https://arvo.guru',
        applicationCategory: 'HealthAndFitnessApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        description:
          'AI-powered smart workout tracker with parametric program builder. Features include workout logging, RPE calculator, progressive overload tracking, and AI coaching recommendations.',
        featureList: [
          'AI Coaching',
          'Workout Logger',
          'RPE Calculator',
          'Progressive Overload Tracking',
          'Custom Workout Splits',
          'Training Program Builder',
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
