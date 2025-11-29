export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Arvo – AI Workout Coach for Gym",
    "applicationCategory": "HealthApplication",
    "applicationSubCategory": "FitnessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
      "description": "Free during beta"
    },
    "description": "AI personal trainer that adapts every set in real-time. 19 specialized agents for progressive overload, fatigue management, and evidence-based training.",
    "keywords": "AI workout coach, AI personal trainer, bodybuilding app, strength training, gym app",
    "url": "https://arvo.guru",
    "image": "https://arvo.guru/og-image.png"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
