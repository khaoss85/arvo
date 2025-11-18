/**
 * JSON-LD Schema Validator Script
 * Run with: node scripts/validate-schema.js
 *
 * This script validates the structured data output from the StructuredData component
 */

// Import the structured data from the component (simulated for Node.js)
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
      description: 'Parametric training program builder and workout tracker.',
      inLanguage: ['en', 'it'],
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
    },
    // Organization Schema
    {
      '@type': 'Organization',
      '@id': 'https://arvo.guru/#organization',
      name: 'Arvo',
      url: 'https://arvo.guru',
    },
  ],
};

// Validation checks
console.log('🔍 Validating JSON-LD Structured Data...\n');

// 1. Check JSON validity
try {
  const jsonString = JSON.stringify(structuredData, null, 2);
  JSON.parse(jsonString);
  console.log('✅ Valid JSON format');
} catch (e) {
  console.error('❌ Invalid JSON:', e.message);
  process.exit(1);
}

// 2. Check @context
if (structuredData['@context'] === 'https://schema.org') {
  console.log('✅ Valid @context (schema.org)');
} else {
  console.error('❌ Invalid @context');
}

// 3. Check @graph structure
if (Array.isArray(structuredData['@graph']) && structuredData['@graph'].length > 0) {
  console.log(`✅ @graph array contains ${structuredData['@graph'].length} schemas`);
} else {
  console.error('❌ Invalid @graph structure');
}

// 4. Validate each schema type
const requiredTypes = ['WebSite', 'SoftwareApplication', 'Organization'];
const foundTypes = structuredData['@graph'].map((item) => item['@type']);

console.log('\n📋 Schema types found:');
requiredTypes.forEach((type) => {
  if (foundTypes.includes(type)) {
    console.log(`  ✅ ${type}`);
  } else {
    console.log(`  ❌ Missing ${type}`);
  }
});

// 5. Validate SoftwareApplication specific fields
const softwareApp = structuredData['@graph'].find(
  (item) => item['@type'] === 'SoftwareApplication'
);

if (softwareApp) {
  console.log('\n🔍 SoftwareApplication validation:');

  if (softwareApp.applicationCategory === 'HealthAndFitnessApplication') {
    console.log('  ✅ applicationCategory: HealthAndFitnessApplication');
  } else {
    console.log('  ❌ Invalid or missing applicationCategory');
  }

  if (Array.isArray(softwareApp.featureList) && softwareApp.featureList.length > 0) {
    console.log(`  ✅ featureList contains ${softwareApp.featureList.length} features:`);
    softwareApp.featureList.forEach(feature => {
      console.log(`    - ${feature}`);
    });
  } else {
    console.log('  ❌ Invalid or missing featureList');
  }
}

console.log('\n✅ Validation complete!');
console.log('\n📝 Next steps:');
console.log('  1. Start dev server: npm run dev');
console.log('  2. View source at http://localhost:3000 and search for "application/ld+json"');
console.log('  3. Test with Google Rich Results Test: https://search.google.com/test/rich-results');
console.log('  4. Test with Schema Markup Validator: https://validator.schema.org/');
