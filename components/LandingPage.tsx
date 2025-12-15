'use client';

import dynamic from 'next/dynamic';
import { Navigation, Footer, SunDecorator } from './landing';
import { useBookingStore } from '@/lib/store';

// Lazy load heavy components below the fold
const HeroSection = dynamic(() => import('./landing').then(mod => ({ default: mod.HeroSection })), {
  loading: () => <div className="h-screen bg-slate-900" />,
});

const StoriesSlider = dynamic(() => import('./landing').then(mod => ({ default: mod.StoriesSlider })), {
  loading: () => <div className="h-96 bg-slate-900" />,
});

const CTABanner = dynamic(() => import('./landing').then(mod => ({ default: mod.CTABanner })));

const NotIncludedSection = dynamic(() => import('./landing').then(mod => ({ default: mod.NotIncludedSection })));

const FAQSection = dynamic(() => import('./landing').then(mod => ({ default: mod.FAQSection })));

const ActivitiesShowcase = dynamic(() => import('./landing').then(mod => ({ default: mod.ActivitiesShowcase })), {
  loading: () => <div className="h-screen bg-slate-900" />,
});

const AccommodationsShowcase = dynamic(() => import('./landing').then(mod => ({ default: mod.AccommodationsShowcase })), {
  loading: () => <div className="h-screen bg-slate-900" />,
});

interface LandingPageProps {
  bookingWidget?: React.ReactNode;
}

export default function LandingPage({ bookingWidget }: LandingPageProps) {
  const landingSectionsHidden = useBookingStore((state) => state.landingSectionsHidden);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Only Mobile */}
      {!landingSectionsHidden && (
        <div className="lg:hidden">
          <HeroSection />
        </div>
      )}

      {/* Main Content */}
      <main className="flex flex-col gap-0 lg:pt-24">
        {!landingSectionsHidden && (
          <>
            {/* Activities Showcase */}
            <section id="activities" className="order-3 lg:hidden">
              <ActivitiesShowcase />
            </section>

            <div className="order-1 lg:order-3 lg:-mt-12">
              <SunDecorator />
            </div>
          </>
        )}

        {/* Booking Widget (passed as prop) */}
        {bookingWidget && (
          <div className="order-2 lg:order-2">{bookingWidget}</div>
        )}

        {!landingSectionsHidden && (
          <>
            {/* Accommodations Showcase */}
            <section id="accommodation" className="order-4 lg:order-5">
              <AccommodationsShowcase />
            </section>

            {/* CTA Banner */}
            <div className="order-5 lg:order-6">
              <CTABanner />
            </div>

            {/* Stories Slider */}
            <section id="stories" className="order-6 lg:order-7">
              <StoriesSlider />
            </section>

            {/* Not Included Section */}
            <div className="order-7 lg:order-8">
              <NotIncludedSection />
            </div>

            {/* FAQs Section */}
            <section id="faqs" className="order-8 lg:order-9">
              <FAQSection />
            </section>

            {/* Final CTA Banner */}
            <div className="order-9 lg:order-10">
              <CTABanner />
            </div>
          </>
        )}
      </main>

      {!landingSectionsHidden && <Footer />}
    </div>
  );
}
