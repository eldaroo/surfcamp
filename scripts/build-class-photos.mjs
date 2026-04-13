#!/usr/bin/env node

/**
 * Build curated class photos for SEO + trust sections.
 *
 * Outputs:
 * - /public/assets/class-photos/<slug>-d.webp (desktop)
 * - /public/assets/class-photos/<slug>-m.webp (mobile)
 * - /public/assets/class-photos/og-*.jpg (OpenGraph)
 * - /lib/class-photos-manifest.json (typed-friendly data source)
 * - /public/assets/class-photos/manifest.json (public copy)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "public", "assets", "Fotos Clases");
const OUTPUT_DIR = path.join(ROOT, "public", "assets", "class-photos");
const LIB_MANIFEST_PATH = path.join(ROOT, "lib", "class-photos-manifest.json");
const PUBLIC_MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");

const DESKTOP_WIDTH = 1920;
const MOBILE_WIDTH = 768;
const DESKTOP_WEBP_QUALITY = 78;
const MOBILE_WEBP_QUALITY = 74;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_QUALITY = 82;

const PHOTO_CONFIG = [
  {
    id: "sl-hero",
    source: "1000011997.jpg",
    slug: "surf-lessons-hero-real-beginner-surf-01",
    altEn: "Adult beginner surfing in Santa Teresa Costa Rica during a real lesson at Zeneidas Surf Garden",
    altEs: "Adulto principiante surfeando en Santa Teresa Costa Rica durante una clase real en Zeneidas Surf Garden",
  },
  {
    id: "sc-hero",
    source: "1000009607.jpg",
    slug: "surf-camp-hero-student-coach-jeep-arrival-01",
    altEn: "Real surf camp students arriving with coach in Santa Teresa Costa Rica before class",
    altEs: "Estudiantes reales del surf camp llegando con coach en Santa Teresa Costa Rica antes de la clase",
  },
  {
    id: "home-moment-01",
    source: "1000009297.jpg",
    slug: "surf-lessons-student-instructor-ocean-celebration-01",
    altEn: "Student and surf instructor celebrating progress in the ocean at Santa Teresa Costa Rica",
    altEs: "Alumno e instructora de surf celebrando progreso en el mar en Santa Teresa Costa Rica",
  },
  {
    id: "home-moment-02",
    source: "1000011993.jpg",
    slug: "surf-camp-student-beach-boardwalk-01",
    altEn: "Surf student walking with board on Santa Teresa beach after a coaching session",
    altEs: "Alumna de surf caminando con tabla por la playa de Santa Teresa después de una sesión de coaching",
  },
  {
    id: "home-moment-03",
    source: "1000012007.jpg",
    slug: "surf-lessons-student-water-celebration-01",
    altEn: "Adult beginner surfer smiling in the water after catching waves in Santa Teresa",
    altEs: "Surfista principiante adulta sonriendo en el agua tras agarrar olas en Santa Teresa",
  },
  {
    id: "home-moment-04",
    source: "1000012014.jpg",
    slug: "surf-lessons-group-highfive-beach-01",
    altEn: "Group surf lesson high five moment on Santa Teresa beach Costa Rica",
    altEs: "Momento de high five en clase grupal de surf en la playa de Santa Teresa Costa Rica",
  },
  {
    id: "home-moment-05",
    source: "1000009585.jpg",
    slug: "surf-lessons-student-instructor-highfive-01",
    altEn: "Student and coach high five after a successful surf lesson in Santa Teresa",
    altEs: "Alumna y coach chocando manos tras una clase de surf exitosa en Santa Teresa",
  },
  {
    id: "sl-result-01",
    source: "1000009286.jpg",
    slug: "surf-lessons-adult-beginner-riding-wave-01",
    altEn: "Adult beginner riding a small wave during surf lessons in Santa Teresa Costa Rica",
    altEs: "Adulta principiante montando una ola pequeña durante clases de surf en Santa Teresa Costa Rica",
  },
  {
    id: "sl-result-02",
    source: "1000011998.jpg",
    slug: "surf-lessons-adult-beginner-riding-wave-02",
    altEn: "Real student surfing whitewater with instructor nearby in Santa Teresa",
    altEs: "Alumna real surfeando espuma con instructora cerca en Santa Teresa",
  },
  {
    id: "sl-result-03",
    source: "1000009568.jpg",
    slug: "surf-lessons-adult-beginner-riding-wave-03",
    altEn: "Beginner surfer improving stance and balance on a lesson wave in Santa Teresa",
    altEs: "Surfista principiante mejorando postura y equilibrio en una ola de clase en Santa Teresa",
  },
  {
    id: "sl-result-04",
    source: "1000012018.jpg",
    slug: "surf-lessons-adult-beginner-riding-wave-04",
    altEn: "Student riding a wave with confidence in Santa Teresa Costa Rica surf class",
    altEs: "Alumno montando una ola con confianza en una clase de surf en Santa Teresa Costa Rica",
  },
  {
    id: "sc-program-core",
    source: "1000009576.jpg",
    slug: "surf-camp-adult-beginner-riding-wave-01",
    altEn: "Core surf program student practicing technique in Santa Teresa Costa Rica",
    altEs: "Alumno del programa Core practicando técnica en Santa Teresa Costa Rica",
  },
  {
    id: "sc-program-intensive",
    source: "1000012017.jpg",
    slug: "surf-camp-adult-beginner-riding-wave-02",
    altEn: "Intensive surf program student riding waves with stable posture in Santa Teresa",
    altEs: "Alumno del programa Intensive surfeando con postura estable en Santa Teresa",
  },
  {
    id: "sc-program-elite",
    source: "1000012002.jpg",
    slug: "surf-camp-adult-beginner-riding-wave-03",
    altEn: "Elite surf program student training advanced balance in Santa Teresa",
    altEs: "Alumno del programa Elite entrenando equilibrio avanzado en Santa Teresa",
  },
  {
    id: "sc-coach-moment-01",
    source: "1000009602.jpg",
    slug: "surf-camp-coach-student-ocean-moment-01",
    altEn: "Coach and student sharing a real surf camp moment in the ocean at Santa Teresa",
    altEs: "Coach y alumno compartiendo un momento real del surf camp en el mar de Santa Teresa",
  },
  {
    id: "sc-coach-moment-02",
    source: "1000009295.jpg",
    slug: "surf-camp-coach-student-beach-moment-01",
    altEn: "Surf coach portrait on Santa Teresa beach highlighting local experience and trust",
    altEs: "Retrato de coach de surf en la playa de Santa Teresa que refuerza experiencia local y confianza",
  },
];

const COLLECTIONS = {
  homeMoments: [
    "home-moment-01",
    "home-moment-02",
    "home-moment-03",
    "home-moment-04",
    "home-moment-05",
  ],
  surfLessonsResults: [
    "sl-result-01",
    "sl-result-02",
    "sl-result-03",
    "sl-result-04",
  ],
  surfLessonsExpectMoments: [
    "home-moment-01",
    "home-moment-03",
    "home-moment-05",
  ],
  surfCampProgramCards: [
    "sc-program-core",
    "sc-program-intensive",
    "sc-program-elite",
  ],
  surfCampCoachMoments: [
    "sc-coach-moment-01",
    "sc-coach-moment-02",
  ],
};

const PAGES = {
  home: {
    heroId: "home-moment-01",
    openGraph: "/assets/class-photos/og-home.jpg",
  },
  surfLessons: {
    heroId: "sl-hero",
    openGraph: "/assets/class-photos/og-surf-lessons.jpg",
  },
  surfCamp: {
    heroId: "sc-hero",
    openGraph: "/assets/class-photos/og-surf-camp.jpg",
  },
};

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function publicPath(fileName) {
  return `/assets/class-photos/${fileName}`;
}

async function encodeWebp({ inputPath, outputPath, width, quality }) {
  await sharp(inputPath)
    .rotate()
    .resize({
      width,
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  const stats = await fs.stat(outputPath);
  return {
    src: publicPath(path.basename(outputPath)),
    width: metadata.width ?? width,
    height: metadata.height ?? 0,
    sizeBytes: stats.size,
  };
}

async function encodeOg({ inputPath, outputPath }) {
  await sharp(inputPath)
    .rotate()
    .resize({
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fit: "cover",
      position: "centre",
      withoutEnlargement: false,
    })
    .jpeg({
      quality: OG_QUALITY,
      progressive: true,
      mozjpeg: true,
    })
    .toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  const stats = await fs.stat(outputPath);
  return {
    src: publicPath(path.basename(outputPath)),
    width: metadata.width ?? OG_WIDTH,
    height: metadata.height ?? OG_HEIGHT,
    sizeBytes: stats.size,
  };
}

async function build() {
  await ensureDir(OUTPUT_DIR);

  const images = [];
  for (const item of PHOTO_CONFIG) {
    const inputPath = path.join(SOURCE_DIR, item.source);
    const desktopFile = `${item.slug}-d.webp`;
    const mobileFile = `${item.slug}-m.webp`;

    const desktop = await encodeWebp({
      inputPath,
      outputPath: path.join(OUTPUT_DIR, desktopFile),
      width: DESKTOP_WIDTH,
      quality: DESKTOP_WEBP_QUALITY,
    });
    const mobile = await encodeWebp({
      inputPath,
      outputPath: path.join(OUTPUT_DIR, mobileFile),
      width: MOBILE_WIDTH,
      quality: MOBILE_WEBP_QUALITY,
    });

    images.push({
      ...item,
      desktop,
      mobile,
    });
  }

  const imageMap = new Map(images.map((image) => [image.id, image]));
  const og = {};

  for (const [pageName, pageConfig] of Object.entries(PAGES)) {
    const hero = imageMap.get(pageConfig.heroId);
    if (!hero) {
      throw new Error(`Missing hero image id "${pageConfig.heroId}" for page "${pageName}"`);
    }
    const outputFile = pageConfig.openGraph.replace("/assets/class-photos/", "");
    // eslint-disable-next-line no-await-in-loop
    og[pageName] = await encodeOg({
      inputPath: path.join(SOURCE_DIR, hero.source),
      outputPath: path.join(OUTPUT_DIR, outputFile),
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir: "public/assets/Fotos Clases",
    outputDir: "public/assets/class-photos",
    settings: {
      desktop: {
        width: DESKTOP_WIDTH,
        quality: DESKTOP_WEBP_QUALITY,
        format: "webp",
      },
      mobile: {
        width: MOBILE_WIDTH,
        quality: MOBILE_WEBP_QUALITY,
        format: "webp",
      },
      openGraph: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        quality: OG_QUALITY,
        format: "jpg",
      },
    },
    images,
    collections: COLLECTIONS,
    pages: PAGES,
    openGraphGenerated: og,
  };

  await fs.writeFile(LIB_MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
  await fs.writeFile(PUBLIC_MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");

  // Compact log for CI/local use.
  const desktopKb = images.reduce((acc, item) => acc + item.desktop.sizeBytes, 0) / 1024;
  const mobileKb = images.reduce((acc, item) => acc + item.mobile.sizeBytes, 0) / 1024;
  console.log(
    `Built ${images.length} class photos. Desktop: ${desktopKb.toFixed(1)}KB, Mobile: ${mobileKb.toFixed(1)}KB`
  );
  console.log(`Manifest: ${path.relative(ROOT, LIB_MANIFEST_PATH)}`);
}

build().catch((error) => {
  console.error("Failed to build class photos:", error);
  process.exitCode = 1;
});
