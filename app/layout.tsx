import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { notFound } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Surf Camp - Reservas y Cotizaciones',
  description: 'Sistema de reservas para surf camp con actividades personalizadas',
  keywords: 'surf, camp, reservas, yoga, baños de hielo, surf lessons',
};

export default function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = require(`../messages/${params.locale}.json`);
  } catch (error) {
    notFound();
  }
  return (
    <html lang={params.locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-sand-50">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 