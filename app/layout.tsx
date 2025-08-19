import { Roboto } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${roboto.variable} font-body`}>
        <div className="min-h-screen bg-[#163237] relative overflow-hidden">
          {/* Efectos de fondo orgánicos */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-xl"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-white rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-white rounded-full blur-xl"></div>
          </div>
          
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