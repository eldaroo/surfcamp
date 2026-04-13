'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  classPhotosManifest,
  getClassPhotoAlt,
  getClassPhotos,
} from '@/lib/classPhotos';

export default function RealClassMoments() {
  const { locale } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);

  const photos = useMemo(
    () => getClassPhotos(classPhotosManifest.collections.homeMoments),
    []
  );

  const copy =
    locale === 'es'
      ? {
          title: 'Momentos Reales de Clases en Santa Teresa',
          subtitle:
            'Historias reales de progreso con alumnos de diferentes edades y niveles.',
        }
      : {
          title: 'Real Class Moments in Santa Teresa',
          subtitle:
            'Real progress stories with students from different ages and skill levels.',
        };

  const next = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
  const prev = () =>
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);

  const current = photos[currentIndex];

  return (
    <section className="py-16 bg-gradient-to-b from-[#f9fbfc] to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-3">
            {copy.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {copy.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-4 lg:gap-6 max-w-6xl mx-auto">
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={current.desktop.src}
                alt={getClassPhotoAlt(current, locale as 'en' | 'es')}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-sm md:text-base font-medium">
                  {getClassPhotoAlt(current, locale as 'en' | 'es')}
                </p>
              </div>

              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-gray-900 p-2 shadow-md"
                aria-label={locale === 'es' ? 'Foto anterior' : 'Previous photo'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white text-gray-900 p-2 shadow-md"
                aria-label={locale === 'es' ? 'Siguiente foto' : 'Next photo'}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <button
                type="button"
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-[#163237] shadow-lg'
                    : 'border-transparent hover:border-[#163237]/40'
                }`}
                aria-label={
                  locale === 'es'
                    ? `Abrir foto ${index + 1}`
                    : `Open photo ${index + 1}`
                }
              >
                <Image
                  src={photo.mobile.src}
                  alt={getClassPhotoAlt(photo, locale as 'en' | 'es')}
                  fill
                  sizes="(max-width: 1024px) 45vw, 20vw"
                  className="object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
