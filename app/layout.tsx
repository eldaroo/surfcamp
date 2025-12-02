import { Roboto } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '@/components/Providers';
import SchemaOrg from '@/components/SchemaOrg';
import { Metadata } from 'next';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://santateresasurfcamp.com'),
  title: 'Zeneidas Surf Garden | Surf & Yoga Experience in Santa Teresa, Costa Rica',
  description: 'Experience surf, yoga, breathwork, and oceanfront living at Zeneidas Surf Garden in Santa Teresa, Costa Rica. Personalized programs, beachfront vibes, and a space to learn, explore, and reconnect.',
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
  icons: {
    icon: '/assets/favicon.png',
    shortcut: '/assets/favicon.png',
    apple: '/assets/favicon.png',
  },
  openGraph: {
    title: 'Zeneidas Surf Garden | Surf & Yoga Experience in Santa Teresa, Costa Rica',
    description: 'Premier Santa Teresa surf camp offering surf lessons, yoga, meditation & ice baths. Transform your life at our beachfront lodge in Costa Rica.',
    url: 'https://santateresasurfcamp.com',
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
    title: 'Zeneidas Surf Garden | Surf & Yoga Experience in Santa Teresa, Costa Rica',
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
    canonical: 'https://santateresasurfcamp.com',
    languages: {
      'es': 'https://santateresasurfcamp.com/es',
      'en': 'https://santateresasurfcamp.com/en',
    },
  },
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale?: string };
}) {
  const lang = params?.locale ?? 'en';

  return (
    <html lang={lang}>
      <body className={`${roboto.variable} ${bochanSerif.variable} font-body`}>
        <SchemaOrg />
        <div
          className="min-h-screen relative overflow-hidden lg:bg-none"
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
            <Providers locale={lang as 'es' | 'en'}>
              {children}
            </Providers>
          </div>
        </div>
      </body>
    </html>
  );
} 
