import { Metadata } from "next";
import { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
  params: { locale: string };
};

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const isSpanish = params.locale === "es";
  const title = isSpanish
    ? "Zeneidas Surf Garden | Experiencia de Surf y Yoga en Santa Teresa, Costa Rica"
    : "Zeneidas Surf Garden | Surf & Yoga Experience in Santa Teresa, Costa Rica";
  const description = isSpanish
    ? "Viví surf, yoga, breathwork y vida frente al mar en Zeneidas Surf Garden en Santa Teresa, Costa Rica. Programas personalizados, ambiente de playa y un espacio para aprender, explorar y reconectar."
    : "Experience surf, yoga, breathwork, and oceanfront living at Zeneidas Surf Garden in Santa Teresa, Costa Rica. Personalized programs, beachfront vibes, and a space to learn, explore, and reconnect.";
  const base = "https://santateresasurfcamp.com";
  const localePath = params.locale ? `/${params.locale}` : "";
  const canonical = `${base}${localePath}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${base}/en`,
        es: `${base}/es`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: isSpanish ? "es_ES" : "en_US",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
  };
}

export default function LocaleLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
