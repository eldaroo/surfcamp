import type { MetadataRoute } from "next";

// Tus slugs del blog (los de /en y luego generamos /es)
const blogSlugs = [
  "wellness-recovery-zeneidas",
  "ice-bath-protocol-santa-teresa",
  "breathwork-training-surfers",
  "mindful-living-zeneidas",
  "surf-yoga-retreat-daily-rituals",
  "santa-teresa-surf-trip-checklist",
  "santa-teresa-surf-spots-map",
  "santa-teresa-surf-seasons-guide",
];

export default function sitemap(): MetadataRoute.Sitemap {

  const base = "https://santateresasurfcamp.com";

  const staticPages = [
    "",
    "/surf-programs",
    "/surf-camp",
    "/surf-lessons-santa-teresa",
    "/yoga-retreat-santa-teresa",
    "/accommodation-santa-teresa",
    "/yoga",
    "/ice-bath",
    "/ceramics",
    "/surf-blog",
  ];

  const locales = ["en", "es"];

  const urls: MetadataRoute.Sitemap = [];

  // páginas estáticas
  for (const locale of locales) {
    for (const page of staticPages) {
      urls.push({
        url: `${base}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: {
          languages: {
            en: `${base}/en${page}`,
            es: `${base}/es${page}`,
          },
        },
      });
    }
  }

  // blog dinámico
  for (const slug of blogSlugs) {
    for (const locale of locales) {
      urls.push({
        url: `${base}/${locale}/surf-blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: {
            en: `${base}/en/surf-blog/${slug}`,
            es: `${base}/es/surf-blog/${slug}`,
          },
        },
      });
    }
  }

  // canonical homepage
  urls.push({
    url: `${base}/`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  });

  return urls;
}
