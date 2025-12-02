import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import { format } from 'date-fns';
import { Navigation, Footer } from '@/components/landing';

export const metadata: Metadata = {
  title: 'Blog | Surf, Yoga & Wellness in Santa Teresa, Costa Rica',
  description: 'Discover expert guides, tips, and stories about surfing, yoga, breathwork, and wellness in Santa Teresa, Costa Rica. Learn from our surf coaches and wellness practitioners.',
  openGraph: {
    title: 'Blog | Zeneidas Surf Garden',
    description: 'Expert guides about surfing Santa Teresa, yoga retreats, breathwork, and wellness in Costa Rica.',
  },
};

interface BlogPageProps {
  params: {
    locale: 'en' | 'es';
  };
}

export default function BlogPage({ params }: BlogPageProps) {
  const { locale } = params;
  const posts = getAllPosts(locale);

  const translations = {
    en: {
      title: 'Surf, Yoga & Wellness Blog',
      subtitle: 'Expert guides, tips, and stories from Santa Teresa, Costa Rica. Learn about surfing, yoga, breathwork, ice baths, and transformative wellness experiences.',
      noPosts: 'No blog posts available yet. Check back soon!',
      readMore: 'Read more',
      ctaTitle: 'Ready to Experience Santa Teresa?',
      ctaSubtitle: 'Join us at Zeneidas Surf Garden for the ultimate surf and yoga experience in Costa Rica.',
      ctaButton: 'Book Your Experience',
    },
    es: {
      title: 'Blog de Surf, Yoga y Bienestar',
      subtitle: 'Guías expertas, consejos e historias desde Santa Teresa, Costa Rica. Aprende sobre surf, yoga, respiración, baños de hielo y experiencias transformadoras de bienestar.',
      noPosts: '¡Aún no hay publicaciones disponibles! Vuelve pronto.',
      readMore: 'Leer más',
      ctaTitle: '¿Listo para Experimentar Santa Teresa?',
      ctaSubtitle: 'Únete a nosotros en Zeneidas Surf Garden para la mejor experiencia de surf y yoga en Costa Rica.',
      ctaButton: 'Reserva tu Experiencia',
    },
  };

  const t = translations[locale];

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pt-32 pb-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-6">
              {t.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          {/* Blog Posts Grid */}
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600">{t.noPosts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Featured Image */}
                  <div className="relative aspect-[16/9] bg-gray-200 overflow-hidden">
                    {post.featured_image ? (
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#163237] to-[#997146] flex items-center justify-center">
                        <span className="text-white text-6xl">🌊</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category & Date */}
                    <div className="flex items-center gap-3 mb-3">
                      {post.category && (
                        <span className="text-xs font-semibold text-[#997146] uppercase tracking-wide">
                          {post.category}
                        </span>
                      )}
                      {post.date && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(post.date), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-heading font-bold text-gray-900 mb-3 group-hover:text-[#163237] transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {post.meta_description}
                    </p>

                    {/* Read More */}
                    <div className="flex items-center text-[#163237] font-semibold group-hover:gap-2 transition-all">
                      <span>{t.readMore}</span>
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-20 bg-gradient-to-r from-[#163237] to-[#0f2328] rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {t.ctaTitle}
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              {t.ctaSubtitle}
            </p>
            <Link
              href={`/${locale}/#personalize-experience`}
              className="inline-block px-8 py-4 bg-white text-[#163237] text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {t.ctaButton}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
