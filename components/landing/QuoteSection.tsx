'use client';

import { ArrowDecorator } from './Decorators';

export default function QuoteSection() {
  return (
    <>
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
              Can you hear the voice inside you that has been telling you that there is more to life than what you have been choosing?
            </p>
          </div>
        </div>
      </section>
      <ArrowDecorator />
    </>
  );
}
