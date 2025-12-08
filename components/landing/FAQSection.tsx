'use client';

import { useState } from 'react';

const faqs = [
  {
    id: 1,
    question: 'What level of surfing experience do I need at this Santa Teresa surf camp?',
    answer:
      'Our Santa Teresa surf camp welcomes all levels! We offer surf lessons for all levels in Costa Rica - whether you are a complete beginner or an experienced surfer, our certified instructors will adapt the lessons to your level. At our surf & yoga camp in Santa Teresa, we provide personalized attention to ensure everyone progresses at their own pace.',
  },
  {
    id: 3,
    question: 'How do I get to Santa Teresa?',
    answer:
      'Santa Teresa is located on the Nicoya Peninsula in Costa Rica. The closest international airports are in San Jose (SJO) and Liberia (LIR). We can help arrange transportation from either airport to our surf camp in Santa Teresa. The journey is part of the adventure!',
  },
  {
    id: 4,
    question: 'What should I bring?',
    answer:
      'Bring comfortable clothes for yoga and activities, swimwear, sunscreen (reef-safe), insect repellent, a reusable water bottle, and an open mind! We provide surf equipment, yoga mats, and towels. Don\'t forget your sense of adventure!',
  },
  {
    id: 5,
    question: 'Can I come alone or do I need to book with a group?',
    answer:
      'You can absolutely come alone! Many of our guests travel solo and find it to be a transformative experience. You will be part of a community of like-minded people. We also welcome couples, friends, and groups.',
  },
  {
    id: 6,
    question: 'What is the best time to visit?',
    answer:
      'Santa Teresa has great surf and weather year-round! The dry season (December to April) offers consistent waves and sunny days. The green season (May to November) brings lush landscapes, fewer crowds, and afternoon showers. Each season has its own magic.',
  },
  {
    id: 8,
    question: 'What is your cancellation policy?',
    answer:
      'We understand that plans can change. Cancellations made 30+ days before arrival receive a full refund minus a small processing fee. Cancellations made 15-30 days before receive 50% refund. Cancellations within 14 days are non-refundable. We recommend travel insurance.',
  },
];

export default function FAQSection() {
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
            Santa Teresa Surf Camp FAQs
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about your surf & yoga experience in Santa Teresa, Costa Rica
          </p>
        </div>

        {/* FAQ Accordion - styled like Not Included */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className={`${index === faqs.length - 1 ? 'md:col-span-2' : ''}`}
              >
                <div className="border-t border-black">
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={openItems.includes(faq.id)}
                  >
                    <span className="text-lg md:text-xl font-medium text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center transition-transform duration-200 ${
                        openItems.includes(faq.id) ? 'rotate-45' : ''
                      }`}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                  {openItems.includes(faq.id) && (
                    <div className="pb-6 pr-14">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-black mt-0" />
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <a
            href="https://wa.link/cqy47y"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-[#163237] text-white font-semibold rounded-md hover:bg-[#0f2328] transition-colors duration-200"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
