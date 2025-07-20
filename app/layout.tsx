import { Inter } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <I18nProvider>
          <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-sand-50">
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
} 