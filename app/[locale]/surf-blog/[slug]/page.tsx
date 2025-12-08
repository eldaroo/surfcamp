import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug } from '@/lib/blog';
import { format } from 'date-fns';
import { Navigation, Footer } from '@/components/landing';
import MarkdownContent from '@/components/blog/MarkdownContent';

interface PageProps {
  params: {
    slug: string;
    locale: 'en' | 'es';
  };
}

export async function generateStaticParams() {
  const locales = ['en', 'es'] as const;
  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    const slugs = getAllPostSlugs(locale);
    slugs.forEach((slug) => {
      params.push({ locale, slug });
    });
  }

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug, params.locale);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.meta_description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      images: post.featured_image ? [post.featured_image] : [],
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description,
      images: post.featured_image ? [post.featured_image] : [],
    },
  };
}

export default function BlogPostPage({ params }: PageProps) {
  const { slug, locale } = params;
  const post = getPostBySlug(slug, locale);

  const translations = {
    en: {
      backToBlog: '← Back to Surf Blog',
    },
    es: {
      backToBlog: '← Volver al Blog',
    },
  };

  const t = translations[locale];

  if (!post) {
    notFound();
  }

  // JSON-LD Schema for BlogPosting
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description,
    image: post.featured_image
      ? `https://santateresasurfcamp.com${post.featured_image}`
      : 'https://santateresasurfcamp.com/assets/Surf.jpg',
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Zeneidas Surf Garden',
      logo: {
        '@type': 'ImageObject',
        url: 'https://santateresasurfcamp.com/assets/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://santateresasurfcamp.com/${locale}/surf-blog/${post.slug}`,
    },
    keywords: post.keywords.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />

      <div className="min-h-screen bg-white">
        <Navigation />

        <main className="pt-32 pb-20 bg-white">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative w-full h-[400px] md:h-[500px] mb-12">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          <div className="container mx-auto px-4 max-w-4xl">
            {/* Breadcrumbs */}
            <nav className="mb-8 text-sm">
              <ol className="flex items-center gap-2 text-gray-600">
                <li>
                  <Link href="/" className="hover:text-[#163237]">
                    Home
                  </Link>
                </li>
                <li>/</li>
                <li>
                  <Link href={`/${locale}/surf-blog`} className="hover:text-[#163237]">
                    Surf Blog
                  </Link>
                </li>
                <li>/</li>
                <li className="text-gray-900 font-medium line-clamp-1">{post.title}</li>
              </ol>
            </nav>

            {/* Header */}
            <header className="mb-12">
              {/* Category */}
              {post.category && (
                <div className="mb-4">
                  <span className="inline-block px-4 py-1 bg-[#997146] text-white text-sm font-semibold rounded-full uppercase tracking-wide">
                    {post.category}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                {post.author && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{post.author}</span>
                  </div>
                )}
                {post.date && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <time dateTime={post.date}>
                      {format(new Date(post.date), 'MMMM dd, yyyy')}
                    </time>
                  </div>
                )}
              </div>
            </header>

            {/* Article Content */}
            <article className="prose prose-lg max-w-none mb-16">
              <MarkdownContent content={post.content} />
            </article>

            {/* Divider */}
            <hr className="my-12 border-t-2 border-gray-200" />

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-[#163237] to-[#0f2328] rounded-2xl p-8 md:p-12 text-center text-white mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Ready to Experience This Yourself?
              </h2>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                Join us at Zeneidas Surf Garden for an unforgettable surf and yoga experience in Santa Teresa, Costa Rica.
              </p>
              <Link
                href="/#personalize-experience"
                className="inline-block px-8 py-4 bg-white text-[#163237] text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Book Your Stay Now
              </Link>
            </div>

            {/* Back to Blog */}
            <div className="text-center">
              <Link
                href={`/${locale}/surf-blog`}
                className="inline-flex items-center gap-2 text-[#163237] hover:text-[#997146] font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>{t.backToBlog}</span>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
