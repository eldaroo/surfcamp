'use client';

import { useState } from 'react';

const notIncludedItems = [
  {
    id: 1,
    title: 'Transportation to and from Santa Teresa',
    description:
      'We can help book a transportation for you from any of international airports or other places in Costa Rica. Moreover, we advise to arrive earlier or extend your stay to enjoy this jungle paradise!',
  },
  {
    id: 2,
    title: 'Flight Tickets',
    description: 'We can connect you with our partners who can help finding most suitable flights!',
  },
  {
    id: 3,
    title: 'Medical Insurance',
    description:
      'Safety First! Please, make sure you travel with insurance, and be responsible for your own health and safety on the trip!',
  },
];

export default function NotIncludedSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What is NOT Included
          </h2>
        </div>

        {/* Accordion Items */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            {notIncludedItems.map((item, index) => (
              <div
                key={item.id}
                className={`${index === 2 ? 'md:col-span-2' : ''}`}
              >
                <div className="border-t border-black">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={openItems.includes(item.id)}
                  >
                    <span className="text-lg md:text-xl font-medium text-gray-900 pr-4">
                      {item.title}
                    </span>
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center transition-transform duration-200 ${
                        openItems.includes(item.id) ? 'rotate-45' : ''
                      }`}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                  {openItems.includes(item.id) && (
                    <div className="pb-6 pr-14">
                      <p className="text-gray-700 leading-relaxed">{item.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Bottom border for last item */}
          <div className="border-t border-black mt-0" />
        </div>
      </div>
    </section>
  );
}
