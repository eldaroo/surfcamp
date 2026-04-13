import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import { classPhotosManifest } from '@/lib/classPhotos';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

export function generateMetadata({ params }: PageProps): Metadata {
  const isSpanish = params.locale === 'es';
  const base = 'https://santateresasurfcamp.com';

  const title = isSpanish
    ? 'Zeneidas Surf Garden | Surf Camp y Yoga en Santa Teresa, Costa Rica'
    : 'Zeneidas Surf Garden | Surf Camp & Yoga in Santa Teresa, Costa Rica';

  const description = isSpanish
    ? 'El mejor surf camp en Santa Teresa, Costa Rica. Clases de surf para todos los niveles, yoga frente al mar, alojamiento en la playa y más. Reservá tu experiencia.'
    : 'The best surf camp in Santa Teresa, Costa Rica. Surf lessons for all levels, oceanfront yoga, beachfront accommodation, ice baths and breathwork. Book your experience.';

  return {
    title,
    description,
    keywords: isSpanish
      ? ['surf camp santa teresa', 'clases de surf costa rica', 'surf camp costa rica', 'yoga santa teresa', 'alojamiento santa teresa']
      : ['surf camp santa teresa', 'surf lessons santa teresa', 'surf camp costa rica', 'yoga retreat santa teresa', 'santa teresa costa rica'],
    alternates: {
      canonical: `${base}/${params.locale}`,
      languages: {
        en: `${base}/en`,
        es: `${base}/es`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${base}/${params.locale}`,
      locale: isSpanish ? 'es_ES' : 'en_US',
      images: [classPhotosManifest.pages.home.openGraph],
    },
  };
}

export default function HomePage() {
  return <HomePageClient />;
}
