import { Metadata } from 'next';
import { Navigation, Footer } from '@/components/landing';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getStoryBySlug, getAllStorySlugs } from '@/lib/stories';
import ReactMarkdown from 'react-markdown';

interface PageProps {
  params: {
    slug: string;
    locale: 'en' | 'es';
  };
}

export async function generateStaticParams() {
  const slugsEn = getAllStorySlugs('en');
  const slugsEs = getAllStorySlugs('es');

  return [
    ...slugsEn.map(slug => ({ locale: 'en' as const, slug })),
    ...slugsEs.map(slug => ({ locale: 'es' as const, slug })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const story = getStoryBySlug(params.slug, params.locale);

  if (!story) {
    return {
      title: 'Story Not Found',
    };
  }

  return {
    title: `${story.title} | Zeneidas Surf Garden`,
    description: story.meta_description,
    keywords: story.keywords,
    alternates: {
      canonical: `https://santateresasurfcamp.com/${params.locale}/stories/${params.slug}`,
      languages: {
        en: `https://santateresasurfcamp.com/en/stories/${params.slug}`,
        es: `https://santateresasurfcamp.com/es/stories/${params.slug}`,
      },
    },
    openGraph: {
      title: story.title,
      description: story.meta_description,
      images: [story.featured_image],
      locale: params.locale === 'es' ? 'es_ES' : 'en_US',
    },
  };
}

export default function StoryDetailPage({ params }: PageProps) {
  const { locale, slug } = params;
  const story = getStoryBySlug(slug, locale);

  if (!story) {
    notFound();
  }

  const content = {
    en: {
      backToStories: '← Back to Stories',
      cta: 'Start Your Own Journey',
    },
    es: {
      backToStories: '← Volver a Historias',
      cta: 'Comienza tu Propio Viaje',
    },
  };

  const t = content[locale];

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-white">
        {/* Hero Section with Featured Image */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={story.featured_image}
              alt={story.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
          </div>

          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
              {story.name}
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto italic">
              &ldquo;{story.quote}&rdquo;
            </p>
            <p className="mt-4 text-lg text-white/90">
              {story.age} • {story.country} • {story.occupation}
            </p>
          </div>
        </section>

        {/* Story Content */}
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Back link */}
          <Link
            href={`/${locale}/stories`}
            className="inline-flex items-center gap-2 text-[#163237] hover:text-[#997146] font-semibold mb-8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>{t.backToStories}</span>
          </Link>

          {/* Markdown Content */}
          <article className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-3xl font-heading font-bold text-gray-900 mt-12 mb-6">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-2xl font-heading font-bold text-gray-900 mt-8 mb-4">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-gray-900">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-800">
                    {children}
                  </em>
                ),
              }}
            >
              {story.content}
            </ReactMarkdown>
          </article>

          {/* CTA Section */}
          <div className="mt-16 text-center border-t-2 border-gray-200 pt-12">
            <Link
              href={`/${locale}/#personalize-experience`}
              className="inline-block px-8 py-4 bg-[#163237] text-white text-lg font-semibold rounded-lg hover:bg-[#0f2328] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t.cta}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
