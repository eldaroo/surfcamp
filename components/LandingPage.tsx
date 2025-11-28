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

      {/* Hero Section */}
      <HeroSection />

      {/* Booking Widget (passed as prop) */}
      {bookingWidget}

      {/* Main Content */}
      <main>
        <SunDecorator />

        {/* Activities Showcase */}
        <section id="activities">
          <ActivitiesShowcase />
        </section>

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
