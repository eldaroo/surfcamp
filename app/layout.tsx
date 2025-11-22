import { Roboto } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '@/components/Providers';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${bochanSerif.variable} font-body`}>
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