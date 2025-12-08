import { Metadata } from 'next';
import { Navigation, Footer } from '@/components/landing';
import Link from 'next/link';
import Image from 'next/image';
import { getAllStories } from '@/lib/stories';

type PageProps = {
  params: { locale: 'en' | 'es' };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isSpanish = params.locale === 'es';

  return {
    title: isSpanish
      ? 'Historias de Huéspedes | Zeneidas Surf Garden'
      : 'Guest Stories | Zeneidas Surf Garden',
    description: isSpanish
      ? 'Descubre historias de transformación y aventura de nuestros huéspedes en Santa Teresa, Costa Rica. Experiencias reales de surf, yoga y bienestar.'
      : 'Discover transformation and adventure stories from our guests in Santa Teresa, Costa Rica. Real experiences of surf, yoga, and wellness.',
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/stories`,
      languages: {
        en: 'https://santateresasurfcamp.com/en/stories',
        es: 'https://santateresasurfcamp.com/es/stories',
      },
    },
    openGraph: {
      title: isSpanish
        ? 'Historias de Huéspedes | Zeneidas Surf Garden'
        : 'Guest Stories | Zeneidas Surf Garden',
      description: isSpanish
        ? 'Descubre historias de transformación y aventura de nuestros huéspedes en Santa Teresa, Costa Rica. Experiencias reales de surf, yoga y bienestar.'
        : 'Discover transformation and adventure stories from our guests in Santa Teresa, Costa Rica. Real experiences of surf, yoga, and wellness.',
      locale: isSpanish ? 'es_ES' : 'en_US',
      images: ['/assets/reviews/reviews-lujan.jpg'],
    },
  };
}

export default function StoriesPage({ params }: PageProps) {
  const { locale } = params;
  const isSpanish = locale === 'es';
  const stories = getAllStories(locale);

  const content = {
    en: {
      hero: {
        title: 'Guest Stories',
        subtitle: 'Real experiences from those who found transformation at Zeneidas',
      },
      intro: {
        title: 'Transformative Experiences',
        description: 'Discover how our guests have found connection, growth, and unforgettable moments in Santa Teresa. From first-time surfers to seasoned yogis, each story is unique but shares a common thread of transformation and community.',
      },
      readStory: 'Read Full Story',
      cta: 'Start Your Own Story',
    },
    es: {
      hero: {
        title: 'Historias de Huéspedes',
        subtitle: 'Experiencias reales de quienes encontraron transformación en Zeneidas',
      },
      intro: {
        title: 'Experiencias Transformadoras',
        description: 'Descubre cómo nuestros huéspedes han encontrado conexión, crecimiento y momentos inolvidables en Santa Teresa. Desde surfistas primerizos hasta yoguis experimentados, cada historia es única pero comparte un hilo común de transformación y comunidad.',
      },
      readStory: 'Leer Historia Completa',
      cta: 'Comienza tu Propia Historia',
    },
  };

  const t = content[locale];

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/assets/reviews/reviews-lujan.jpg)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
          </div>

          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6">
              {t.hero.title}
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              {t.hero.subtitle}
            </p>
          </div>
        </section>

        {/* Intro Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6 text-center">
              {t.intro.title}
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed mb-8 text-center">
              {t.intro.description}
            </p>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.map((story) => (
                <Link
                  key={story.slug}
                  href={`/${locale}/stories/${story.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {/* Story Image */}
                  <div className="relative h-64 bg-gradient-to-br from-[#163237] to-[#2a4f57]">
                    <Image
                      src={story.featured_image}
                      alt={story.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Quote Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-white font-semibold text-lg italic">
                        &ldquo;{story.quote}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Story Info */}
                  <div className="p-6">
                    <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                      {story.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {story.age} • {story.country} • {story.occupation}
                    </p>
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {story.meta_description}
                    </p>
                    <span className="text-[#163237] font-semibold hover:text-[#997146] transition-colors">
                      {t.readStory} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <Link
              href={`/${locale}/#personalize-experience`}
              className="inline-block px-8 py-4 bg-[#163237] text-white text-lg font-semibold rounded-lg hover:bg-[#0f2328] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t.cta}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
