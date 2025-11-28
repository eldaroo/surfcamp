'use client';

export default function SchemaOrg() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": "Zeneidas Surf - Santa Teresa Surf Camp",
    "alternateName": "Santa Teresa Surf Camp",
    "description": "Premier surf camp in Santa Teresa, Costa Rica offering surf lessons, yoga, meditation, ice baths and beachfront accommodation.",
    "url": "https://surfcampwidget.duckdns.org",
    "telephone": "+541153695627",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Santa Teresa",
      "addressRegion": "Puntarenas",
      "addressCountry": "CR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "9.6428",
      "longitude": "-85.1703"
    },
    "priceRange": "$$",
    "image": [
      "https://surfcampwidget.duckdns.org/assets/Surf.jpg",
      "https://surfcampwidget.duckdns.org/assets/Yoga.jpg",
      "https://surfcampwidget.duckdns.org/assets/Icebath.jpg"
    ],
    "sameAs": [
      "https://www.instagram.com/zeneidas.surf"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Surf Camp Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Surf Lessons",
            "description": "Professional surf instruction in the pristine waters of Santa Teresa"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Yoga Classes",
            "description": "Daily yoga and meditation sessions for all levels"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Ice Baths",
            "description": "Cold therapy sessions for recovery and wellness"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Beachfront Accommodation",
            "description": "Shared rooms, private cabins, and deluxe studios"
          }
        }
      ]
    },
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "Beach Access",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Surf Equipment Rental",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Yoga Studio",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Kitchen Facilities",
        "value": true
      }
    ],
    "keywords": "Santa Teresa surf, Santa Teresa surf camp, surf lessons Costa Rica, yoga retreat, ice bath therapy, beach accommodation, surf school, Costa Rica wellness retreat"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
