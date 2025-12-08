"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Users, Home, Sparkles, Check } from 'lucide-react';

interface RoomCard {
  id: string;
  images: string[];
  capacity: number;
  name: string;
  description: string;
  features: string[];
  capacityLabel: string;
}

interface RoomGalleryGridProps {
  rooms: RoomCard[];
  locale: string;
}

const iconMap: Record<string, any> = {
  'casa-playa': Users,
  'casitas-privadas': Home,
  'casas-deluxe': Sparkles,
};

export default function RoomGalleryGrid({ rooms, locale }: RoomGalleryGridProps) {
  const [indexes, setIndexes] = useState<Record<string, number>>(
    () => Object.fromEntries(rooms.map((room) => [room.id, 0]))
  );

  const handlePrev = (id: string, total: number) => {
    setIndexes((prev) => ({
      ...prev,
      [id]: (prev[id] - 1 + total) % total,
    }));
  };

  const handleNext = (id: string, total: number) => {
    setIndexes((prev) => ({
      ...prev,
      [id]: (prev[id] + 1) % total,
    }));
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {rooms.map((room) => {
        const Icon = iconMap[room.id] || Users;
        const currentIndex = indexes[room.id] ?? 0;
        const totalImages = room.images.length;

        return (
          <div key={room.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="relative h-64">
              <Image
                src={room.images[currentIndex]}
                alt={room.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority
              />
              {totalImages > 1 && (
                <>
                  <button
                    onClick={() => handlePrev(room.id, totalImages)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 text-slate-900 p-2 rounded-full shadow hover:bg-white transition"
                    aria-label={locale === 'es' ? 'Imagen anterior' : 'Previous image'}
                  >
                    {'<'}
                  </button>
                  <button
                    onClick={() => handleNext(room.id, totalImages)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 text-slate-900 p-2 rounded-full shadow hover:bg-white transition"
                    aria-label={locale === 'es' ? 'Siguiente imagen' : 'Next image'}
                  >
                    {'>'}
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {room.images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-2 w-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/60'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="w-8 h-8 text-[#163237]" />
                <h3 className="text-2xl font-heading font-bold text-gray-900">
                  {room.name}
                </h3>
              </div>

              <div className="text-[#997146] font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {room.capacityLabel}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                {room.description}
              </p>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-600 uppercase mb-3">
                  {locale === 'en' ? 'Features' : 'Características'}
                </div>
                <ul className="space-y-2">
                  {room.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-900">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
