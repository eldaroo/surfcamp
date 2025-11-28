import { Roboto } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '@/components/Providers';
<<<<<<< HEAD
=======
import SchemaOrg from '@/components/SchemaOrg';
import { Metadata } from 'next';
>>>>>>> feature/nueva-feature-clean

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto'
});

const bochanSerif = localFont({
  src: '../public/fonts/BochanSerif.ttf',
  variable: '--font-bochan',
  display: 'swap',
  weight: '400 600',
});

<<<<<<< HEAD
=======
export const metadata: Metadata = {
  title: 'Zeneidas Surf - Santa Teresa Surf Camp | Surf, Yoga & Ice Baths in Costa Rica',
  description: 'Experience the best Santa Teresa surf camp at Zeneidas Surf. Premier surf lessons, yoga, meditation, and ice baths in Santa Teresa, Costa Rica. Book your transformative surf retreat today.',
  keywords: [
    'Santa Teresa surf',
    'Santa Teresa surf camp',
    'Zeneidas Surf',
    'surf camp Costa Rica',
    'Santa Teresa Costa Rica',
    'surf lessons Santa Teresa',
    'yoga Santa Teresa',
    'surf retreat Costa Rica',
    'beach accommodation Santa Teresa',
    'ice bath Costa Rica',
    'meditation retreat',
    'surf school Santa Teresa',
    'Costa Rica surfcamp'
  ],
  authors: [{ name: 'Zeneidas Surf' }],
  openGraph: {
    title: 'Zeneidas Surf - Santa Teresa Surf Camp',
    description: 'Premier Santa Teresa surf camp offering surf lessons, yoga, meditation & ice baths. Transform your life at our beachfront lodge in Costa Rica.',
    url: 'https://surfcampwidget.duckdns.org',
    siteName: 'Zeneidas Surf',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/assets/Surf.jpg',
        width: 1200,
        height: 630,
        alt: 'Santa Teresa Surf Camp - Zeneidas Surf'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zeneidas Surf - Santa Teresa Surf Camp',
    description: 'Premier Santa Teresa surf camp with surf lessons, yoga & wellness activities in Costa Rica',
    images: ['/assets/Surf.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Agrega aquí tu código de verificación de Google Search Console cuando lo tengas
    // google: 'tu-codigo-de-verificacion',
  },
  alternates: {
    canonical: 'https://surfcampwidget.duckdns.org',
    languages: {
      'es': 'https://surfcampwidget.duckdns.org/es',
      'en': 'https://surfcampwidget.duckdns.org/en',
    },
  },
};

>>>>>>> feature/nueva-feature-clean
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${bochanSerif.variable} font-body`}>
<<<<<<< HEAD
=======
        <SchemaOrg />
>>>>>>> feature/nueva-feature-clean
        <div
          className="min-h-screen relative overflow-hidden"
          style={{
            backgroundImage: 'url(/assets/background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Contenido principal */}
          <div className="relative z-10">
            <Providers>
              {children}
            </Providers>
          </div>
        </div>
      </body>
    </html>
  );
} 