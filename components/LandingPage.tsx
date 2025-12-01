'use client';

import {
  Navigation,
  Footer,
  HeroSection,
  StoriesSlider,
  CTABanner,
  NotIncludedSection,
  FAQSection,
  ActivitiesShowcase,
  AccommodationsShowcase,
  SunDecorator,
} from './landing';
import { useBookingStore } from '@/lib/store';

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
      <main className="flex flex-col gap-0">
        {!landingSectionsHidden && (
          <>
            {/* Activities Showcase */}
            <section id="activities" className="order-3 lg:order-1">
              <ActivitiesShowcase />
            </section>

            <div className="order-1 lg:order-2 -mt-4 lg:-mt-12">
              <SunDecorator />
            </div>
          </>
        )}

        {/* Booking Widget (passed as prop) */}
        {bookingWidget && (
          <div className="order-2 lg:order-3">{bookingWidget}</div>
        )}

        {!landingSectionsHidden && (
          <>
            {/* Accommodations Showcase */}
            <section id="accommodation" className="order-4 lg:order-4">
              <AccommodationsShowcase />
            </section>

            {/* CTA Banner */}
            <div className="order-5 lg:order-5">
              <CTABanner />
            </div>

            {/* Stories Slider */}
            <section id="stories" className="order-6 lg:order-6">
              <StoriesSlider />
            </section>

            {/* Not Included Section */}
            <div className="order-7 lg:order-7">
              <NotIncludedSection />
            </div>

            {/* FAQs Section */}
            <section id="faqs" className="order-8 lg:order-8">
              <FAQSection />
            </section>

            {/* Final CTA Banner */}
            <div className="order-9 lg:order-9">
              <CTABanner />
            </div>
          </>
        )}
      </main>

      {!landingSectionsHidden && <Footer />}
    </div>
  );
}
