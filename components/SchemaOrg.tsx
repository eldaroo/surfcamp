'use client';

import { useMemo } from 'react';

export default function SchemaOrg() {
  const schemaData = useMemo(() => {
    const baseUrl = 'https://santateresasurfcamp.com';
    const lang =
      typeof document !== 'undefined'
        ? document.documentElement.lang || 'en'
        : 'en';
    const isSpanish = lang.startsWith('es');
    const localePath = isSpanish ? '/es' : '/en';
    const name = isSpanish
      ? 'Zeneidas Surf Garden | Experiencia de Surf y Yoga en Santa Teresa, Costa Rica'
      : 'Zeneidas Surf Garden | Surf & Yoga Experience in Santa Teresa, Costa Rica';
    const description = isSpanish
      ? 'Viví surf, yoga, breathwork y vida frente al mar en Zeneidas Surf Garden en Santa Teresa, Costa Rica. Programas personalizados, ambiente de playa y un espacio para aprender, explorar y reconectar.'
      : 'Experience surf, yoga, breathwork, and oceanfront living at Zeneidas Surf Garden in Santa Teresa, Costa Rica. Personalized programs, beachfront vibes, and a space to learn, explore, and reconnect.';

    return {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name,
      alternateName: 'Santa Teresa Surf Camp',
      description,
      url: `${baseUrl}${localePath}`,
      inLanguage: isSpanish ? 'es-CR' : 'en-US',
      telephone: '+541153695627',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Santa Teresa',
        addressRegion: 'Puntarenas',
        addressCountry: 'CR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '9.6428',
        longitude: '-85.1703',
      },
      priceRange: '$$',
      image: [
        `${baseUrl}/assets/Surf.jpg`,
        `${baseUrl}/assets/Yoga.jpg`,
        `${baseUrl}/assets/Icebath.jpg`,
      ],
      sameAs: ['https://www.instagram.com/zeneidas.surf'],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Surf Camp Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isSpanish ? 'Clases de Surf' : 'Surf Lessons',
              description: isSpanish
                ? 'Instrucción profesional de surf en las olas de Santa Teresa'
                : 'Professional surf instruction in the pristine waters of Santa Teresa',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isSpanish ? 'Clases de Yoga' : 'Yoga Classes',
              description: isSpanish
                ? 'Sesiones diarias de yoga y meditación para todos los niveles'
                : 'Daily yoga and meditation sessions for all levels',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isSpanish ? 'Baños de Hielo' : 'Ice Baths',
              description: isSpanish
                ? 'Terapia de frío para recuperación y bienestar'
                : 'Cold therapy sessions for recovery and wellness',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isSpanish ? 'Alojamiento Frente al Mar' : 'Beachfront Accommodation',
              description: isSpanish
                ? 'Cuartos compartidos, cabañas privadas y estudios deluxe frente al mar'
                : 'Shared rooms, private cabins, and deluxe studios on the beach',
            },
          },
        ],
      },
      amenityFeature: [
        {
          '@type': 'LocationFeatureSpecification',
          name: 'Beach Access',
          value: true,
        },
        {
          '@type': 'LocationFeatureSpecification',
          name: 'Surf Equipment Rental',
          value: true,
        },
        {
          '@type': 'LocationFeatureSpecification',
          name: 'Yoga Studio',
          value: true,
        },
        {
          '@type': 'LocationFeatureSpecification',
          name: 'Kitchen Facilities',
          value: true,
        },
      ],
      keywords:
        'Santa Teresa surf, Santa Teresa surf camp, surf lessons Costa Rica, yoga retreat, ice bath therapy, beach accommodation, surf school, Costa Rica wellness retreat',
    };
  }, []);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
