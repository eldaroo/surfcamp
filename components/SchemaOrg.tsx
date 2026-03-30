'use client';

import { useMemo } from 'react';

export default function SchemaOrg() {
  const schemas = useMemo(() => {
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

    const touristAttraction = {
      '@context': 'https://schema.org',
      '@type': ['TouristAttraction', 'LodgingBusiness', 'SportsActivityLocation'],
      name,
      alternateName: 'Santa Teresa Surf Camp',
      description,
      url: `${baseUrl}${localePath}`,
      inLanguage: isSpanish ? 'es-CR' : 'en-US',
      telephone: '+541153695627',
      email: 'info@zeneidasgarden.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Santa Teresa',
        addressRegion: 'Puntarenas',
        addressCountry: 'CR',
        streetAddress: 'Santa Teresa Beach',
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
      sameAs: ['https://www.instagram.com/zeneidas.experience/'],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5',
        bestRating: '5',
        worstRating: '1',
        ratingCount: '5',
        reviewCount: '5',
      },
      review: [
        {
          '@type': 'Review',
          author: { '@type': 'Person', name: 'Luján Sánchez' },
          reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
          reviewBody: 'The people, the connection with the nature, the surf... I found in Santa Teresa what I was looking for. I love to live at Zeneidas, it feels like home. This experience opens my mind and allows me to be a better person.',
        },
        {
          '@type': 'Review',
          author: { '@type': 'Person', name: 'Catherine Cormier' },
          reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
          reviewBody: 'This place quickly started to feel like home and the people who work and live here really are like family! The food was so delicious and the location is perfect. I made so many incredible memories.',
        },
        {
          '@type': 'Review',
          author: { '@type': 'Person', name: 'Taylor Evans' },
          reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
          reviewBody: 'I came here not knowing what to expect and was blown away by the community, the activities, and the overall vibe. The surf lessons were amazing, the yoga sessions were exactly what I needed, and the breathwork changed my life.',
        },
        {
          '@type': 'Review',
          author: { '@type': 'Person', name: 'Marcelo' },
          reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
          reviewBody: 'At my age, I never thought I could learn to surf, but the instructors here made it possible and so much fun! The whole experience was rejuvenating - from the morning yoga to the evening gatherings.',
        },
        {
          '@type': 'Review',
          author: { '@type': 'Person', name: 'Eilin Annika Orgland' },
          reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
          reviewBody: 'The most beautiful sunsets, the warmest people, and the most incredible energy. I came here solo and left with a family. The surfcamp exceeded all my expectations and I cannot wait to come back!',
        },
      ],
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
                ? 'Cuartos compartidos, cabañas privadas y casas privadas frente al mar'
                : 'Shared rooms, private cabins, and private houses on the beach',
            },
          },
        ],
      },
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Beach Access', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Surf Equipment Rental', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Yoga Studio', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Kitchen Facilities', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Private Rooms', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Shared Rooms', value: true },
      ],
      keywords:
        'Santa Teresa surf, Santa Teresa surf camp, surf lessons Costa Rica, yoga retreat, ice bath therapy, beach accommodation, surf school, Costa Rica wellness retreat',
    };

    const faqPage = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What level of surfing experience do I need at this Santa Teresa surf camp?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our Santa Teresa surf camp welcomes all levels! We offer surf lessons for complete beginners and experienced surfers. Our certified instructors adapt lessons to your level with personalized attention.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I get to Santa Teresa Costa Rica?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Santa Teresa is located on the Nicoya Peninsula in Costa Rica. The closest international airports are San Jose (SJO) and Liberia (LIR). From San Jose you can take a shuttle + ferry combo (about 4-5 hours) or a domestic flight to Tambor. We can help arrange transportation.',
          },
        },
        {
          '@type': 'Question',
          name: 'What should I bring to a surf camp in Santa Teresa?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bring comfortable clothes for yoga and activities, swimwear, reef-safe sunscreen, insect repellent, a reusable water bottle, and an open mind. We provide surf equipment, yoga mats, and towels.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I come alone to the surf camp?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely! Many of our guests travel solo and find it to be a transformative experience. You will be part of a community of like-minded people from all over the world. We also welcome couples, friends, and groups.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the best time to visit Santa Teresa for surfing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Santa Teresa has great surf year-round. The dry season (December to April) offers consistent waves and sunny days. The green season (May to November) brings lush landscapes, fewer crowds, and great swell. September and October deliver the most powerful waves.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the cancellation policy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cancellations made 30+ days before arrival receive a full refund minus a small processing fee. Cancellations 15-30 days before arrival receive a 50% refund. Cancellations within 14 days are non-refundable. We recommend travel insurance.',
          },
        },
      ],
    };

    return [touristAttraction, faqPage];
  }, []);

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
