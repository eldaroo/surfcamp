import { I18nProvider } from '@/lib/i18n';
import { Locale } from '@/lib/i18n';
import DocumentLangSetter from '@/components/DocumentLangSetter';

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
  const validLocales: Locale[] = ['es', 'en'];
  const isValidLocale = validLocales.includes(locale as Locale);
  
  console.log('🌍 LocaleLayout - Locale válido:', isValidLocale);
  
  if (!isValidLocale) {
    console.log('❌ LocaleLayout - Locale inválido, redirigiendo a /es');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Locale</h1>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }
  
  console.log('✅ LocaleLayout - Locale válido, renderizando con:', locale);
  
  return (
    <I18nProvider initialLocale={locale as Locale}>
      <DocumentLangSetter />
      {children}
    </I18nProvider>
  );
} 