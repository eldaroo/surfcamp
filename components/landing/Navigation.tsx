'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n, type Locale } from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';

interface MenuItem {
  key: string;
  href: string;
  isExternal?: boolean;
}

const menuItems: MenuItem[] = [
  { key: 'experience', href: '#' },
  { key: 'activities', href: '#activities' },
  { key: 'accommodation', href: '#accommodation' },
  { key: 'stories', href: '#stories' },
  { key: 'faqs', href: '#faqs' },
  { key: 'blog', href: '/en/blog', isExternal: true },
];

export default function Navigation() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restaurar la posición del scroll después del cambio de idioma
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
      // Restaurar el scroll después de que el contenido se haya cargado
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
        sessionStorage.removeItem('scrollPosition');
      }, 100);
    }
  }, [pathname]);

  const scrollToSection = (href: string) => {
    // If href is just '#', scroll to top
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsOpen(false);
      return;
    }

    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  const handleLanguageChange = (newLocale: Locale) => {
    // Guardar la posición actual del scroll en sessionStorage
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());

    setLocale(newLocale);

    // Actualizar la URL si usa rutas dinámicas [locale]
    const segments = pathname.split('/');
    if (segments[1] === 'es' || segments[1] === 'en') {
      segments[1] = newLocale;
      router.push(segments.join('/'));
    } else {
      router.push(`/${newLocale}`);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white shadow-md py-3 translate-y-0 opacity-100'
          : 'bg-white/95 py-5 -translate-y-full opacity-0'
      } lg:bg-white lg:shadow-md lg:py-4 lg:translate-y-0 lg:opacity-100`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile: Menu button + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden w-10 h-10 flex flex-col items-center justify-center space-y-1.5"
              aria-label="Toggle menu"
            >
              <span
                className={`block w-6 h-0.5 bg-gray-900 transition-transform duration-300 ${
                  isOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block w-6 h-0.5 bg-gray-900 transition-opacity duration-300 ${
                  isOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block w-6 h-0.5 bg-gray-900 transition-transform duration-300 ${
                  isOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </button>

            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/favicon.png"
                alt="Zeneidas Surf Garden Logo"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <div className="text-xl md:text-2xl font-bold text-[#163237]">
                Zeneidas Surf Garden
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) =>
              item.isExternal ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                >
                  {t(`landing.navigation.${item.key}`)}
                </Link>
              ) : (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                >
                  {t(`landing.navigation.${item.key}`)}
                </button>
              )
            )}

            {/* Language Switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  locale === 'es'
                    ? 'bg-[#163237] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Cambiar a Español"
              >
                ES
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  locale === 'en'
                    ? 'bg-[#163237] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
            </div>
          </div>

          {/* Mobile Language Switcher */}
          <div className="lg:hidden flex items-center justify-end">
            <div className="flex gap-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  locale === 'es'
                    ? 'bg-[#163237] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Cambiar a Español"
              >
                ES
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  locale === 'en'
                    ? 'bg-[#163237] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4 pt-4">
              {menuItems.map((item) =>
                item.isExternal ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-left text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    {t(`landing.navigation.${item.key}`)}
                  </Link>
                ) : (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className="text-left text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                  >
                    {t(`landing.navigation.${item.key}`)}
                  </button>
                )
              )}

            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
