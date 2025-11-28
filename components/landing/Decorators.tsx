'use client';

import Image from 'next/image';

export function SunDecorator() {
  return (
    <div className="flex justify-center py-8 bg-white">
      <div className="w-20 h-20 relative">
        {/* Placeholder for sun icon - replace with actual image */}
        <svg className="w-full h-full text-amber-500" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="20" />
          {[...Array(8)].map((_, i) => (
            <rect
              key={i}
              x="48"
              y="10"
              width="4"
              height="15"
              rx="2"
              transform={`rotate(${i * 45} 50 50)`}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export function MoonDecorator() {
  return (
    <div className="flex justify-center py-16 bg-gray-100">
      <div className="w-20 h-20 relative">
        {/* Placeholder for moon icon - replace with actual image */}
        <svg className="w-full h-full text-gray-400" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 10 A 40 40 0 1 0 50 90 A 35 35 0 1 1 50 10" />
        </svg>
      </div>
    </div>
  );
}

export function ArrowDecorator() {
  return (
    <div className="flex justify-center py-8">
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <svg
            key={i}
            className="w-3 h-3 text-gray-600"
            viewBox="0 0 13 13"
            fill="currentColor"
          >
            <path d="M6.5 0 L13 6.5 L6.5 13 L0 6.5 Z" />
          </svg>
        ))}
      </div>
    </div>
  );
}
