'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n, type Locale } from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  key: string;
  href: string;
  description?: string;
}

interface MenuItem {
  key: string;
  href?: string;
  isExternal?: boolean;
  dropdown?: DropdownItem[];
}

const menuItems: MenuItem[] = [
  { key: 'experience', href: '/' },
  {
    key: 'activities',
    dropdown: [
      { key: 'surfCamp', href: '/surf-camp', description: 'Surf coaching programs' },
      { key: 'yoga', href: '/yoga', description: 'Daily yoga sessions' },
      { key: 'iceBath', href: '/ice-bath', description: 'Cold therapy' },
      { key: 'ceramics', href: '/ceramics', description: 'Creative arts' }
    ]
  },
  { key: 'accommodation', href: '/accommodation-santa-teresa', isExternal: true },
  { key: 'testimonials', href: '/#stories' },
  { key: 'blog', href: '/en/surf-blog', isExternal: true },
];

export default function Navigation() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Prefetch key internal routes to speed up navigation
  useEffect(() => {
    menuItems.forEach((item) => {
      const maybePrefetch = (href?: string, isExternal?: boolean) => {
        if (!href || isExternal) return;
        const url = href.startsWith('/')
          ? href === '/'
            ? `/${locale}`
            : `/${locale}${href}`
          : href;
        router.prefetch(url);
      };

      maybePrefetch(item.href, item.isExternal);
      item.dropdown?.forEach((sub) => maybePrefetch(sub.href));
    });
  }, [router, locale]);

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
    const scrollIntoViewById = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return true;
      }
      return false;
    };

    // Route to main page when using a path (support hash anchors)
    if (href.startsWith('/')) {
      const [pathPart, hash] = href.split('#');
      const targetPath = pathPart === '/' ? `/${locale}` : `/${locale}${pathPart}`;

      if (hash) {
        const fullPath = `${targetPath}#${hash}`;
        const onSamePath = pathname === targetPath;

        if (onSamePath) {
          const scrolled = scrollIntoViewById(hash);
          if (!scrolled) {
            // If section isn't in DOM, open it in a new tab to ensure it's loaded
            window.open(fullPath, '_blank');
          }
          setIsOpen(false);
          return;
        }

        // Open in new tab to guarantee the anchor is loaded and visible
        window.open(fullPath, '_blank');
        setIsOpen(false);
        return;
      }

      router.push(targetPath);
      setIsOpen(false);
      return;
    }

    // If href is just '#', scroll to top
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsOpen(false);
      return;
    }

    const id = href.replace('#', '');
    const scrolled = scrollIntoViewById(id);
    if (!scrolled) {
      window.open(`/${locale}#${id}`, '_blank');
    }
    setIsOpen(false);
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

  const toggleMobileDropdown = (key: string) => {
    setActiveDropdown(activeDropdown === key ? null : key);
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

            <Link
              href="/"
              className="flex items-center space-x-2"
            >
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
            {menuItems.map((item) => {
              if (item.dropdown) {
                // Dropdown menu
                return (
                  <div key={item.key} className="relative group">
                    <button className="flex items-center gap-1 text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200 py-2">
                      {t(`landing.navigation.${item.key}`)}
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Dropdown panel - with padding bridge to prevent gap */}
                    <div className="absolute hidden group-hover:block top-full left-0 pt-2 z-50">
                      <div className="w-64 bg-white shadow-lg rounded-lg border border-gray-200 py-2">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.key}
                            href={`/${locale}${subItem.href}`}
                            className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="font-semibold text-gray-900">
                              {t(`landing.navigation.dropdown.${subItem.key}.title`)}
                            </div>
                            <div className="text-sm text-gray-600 mt-0.5">
                              {t(`landing.navigation.dropdown.${subItem.key}.description`)}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              } else if (item.isExternal) {
                // External link
                return (
                  <Link
                    key={item.key}
                    href={item.href!}
                    className="text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                  >
                    {t(`landing.navigation.${item.key}`)}
                  </Link>
                );
              } else {
                // Regular button (scroll to section)
                return (
                  <button
                    key={item.key}
                    onClick={() => scrollToSection(item.href!)}
                    className="text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                  >
                    {t(`landing.navigation.${item.key}`)}
                  </button>
                );
              }
            })}

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
              {menuItems.map((item) => {
                if (item.dropdown) {
                  // Mobile dropdown (accordion)
                  return (
                    <div key={item.key}>
                      <button
                        onClick={() => toggleMobileDropdown(item.key)}
                        className="flex items-center justify-between w-full text-left text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                      >
                        {t(`landing.navigation.${item.key}`)}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            activeDropdown === item.key ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {activeDropdown === item.key && (
                        <div className="pl-4 mt-2 space-y-2">
                          {item.dropdown.map((subItem) => (
                            <Link
                              key={subItem.key}
                              href={`/${locale}${subItem.href}`}
                              className="block py-2 text-gray-600 hover:text-[#163237] text-sm"
                              onClick={() => setIsOpen(false)}
                            >
                              {t(`landing.navigation.dropdown.${subItem.key}.title`)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } else if (item.isExternal) {
                  // External link
                  return (
                    <Link
                      key={item.key}
                      href={item.href!}
                      className="text-left text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      {t(`landing.navigation.${item.key}`)}
                    </Link>
                  );
                } else {
                  // Regular button (scroll to section)
                  return (
                    <button
                      key={item.key}
                      onClick={() => scrollToSection(item.href!)}
                      className="text-left text-gray-700 hover:text-[#163237] font-medium transition-colors duration-200"
                    >
                      {t(`landing.navigation.${item.key}`)}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
