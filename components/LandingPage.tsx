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

interface LandingPageProps {
  bookingWidget?: React.ReactNode;
}

export default function LandingPage({ bookingWidget }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Only Mobile */}
      <div className="lg:hidden">
        <HeroSection />
      </div>

      {/* Main Content */}
      <main>
        {/* Activities Showcase - First on Desktop */}
        <section id="activities">
          <ActivitiesShowcase />
        </section>

        <SunDecorator />

        {/* Booking Widget (passed as prop) */}
        {bookingWidget}

        {/* Accommodations Showcase */}
        <section id="accommodation">
          <AccommodationsShowcase />
        </section>

        {/* CTA Banner */}
        <CTABanner />

        {/* Stories Slider */}
        <section id="stories">
          <StoriesSlider />
        </section>

        {/* Not Included Section */}
        <NotIncludedSection />

        {/* FAQs Section */}
        <section id="faqs">
          <FAQSection />
        </section>

        {/* Final CTA Banner */}
        <CTABanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
