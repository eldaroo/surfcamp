import { I18nProvider } from '@/lib/i18n';
import LanguageSelector from '@/components/LanguageSelector';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;
  
  console.log('🌍 LocaleLayout - Iniciando con locale:', locale);
  console.log('🌍 LocaleLayout - Tipo de locale:', typeof locale);
  
  // Validar que el locale sea válido
  const validLocales = ['es', 'en'];
  const isValidLocale = validLocales.includes(locale);
  
  console.log('🌍 LocaleLayout - Locale válido:', isValidLocale);
  
  if (!isValidLocale) {
    console.log('❌ LocaleLayout - Locale inválido, redirigiendo a /es');
    return (
      <html lang="es">
        <body>
          <div>Locale no válido. Redirigiendo...</div>
        </body>
      </html>
    );
  }
  
  console.log('✅ LocaleLayout - Locale válido, renderizando con:', locale);
  
  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale}>
          {/* Language Selector en la esquina superior derecha */}
          <div className="fixed top-4 right-4 z-50">
            <LanguageSelector />
          </div>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
} 