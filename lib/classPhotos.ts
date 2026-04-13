import manifestJson from '@/lib/class-photos-manifest.json';

export type SupportedLocale = 'en' | 'es';

export type ClassPhoto = {
  id: string;
  source: string;
  slug: string;
  altEn: string;
  altEs: string;
  desktop: {
    src: string;
    width: number;
    height: number;
    sizeBytes: number;
  };
  mobile: {
    src: string;
    width: number;
    height: number;
    sizeBytes: number;
  };
};

type ClassPhotosManifest = {
  generatedAt: string;
  sourceDir: string;
  outputDir: string;
  images: ClassPhoto[];
  collections: {
    homeMoments: string[];
    surfLessonsResults: string[];
    surfLessonsExpectMoments: string[];
    surfCampProgramCards: string[];
    surfCampCoachMoments: string[];
  };
  pages: {
    home: { heroId: string; openGraph: string };
    surfLessons: { heroId: string; openGraph: string };
    surfCamp: { heroId: string; openGraph: string };
  };
};

export const classPhotosManifest = manifestJson as ClassPhotosManifest;

const photosById = new Map(
  classPhotosManifest.images.map((image) => [image.id, image] as const)
);

export function getClassPhoto(id: string): ClassPhoto {
  const image = photosById.get(id);
  if (!image) {
    throw new Error(`Class photo not found for id: ${id}`);
  }
  return image;
}

export function getClassPhotos(ids: string[]): ClassPhoto[] {
  return ids.map(getClassPhoto);
}

export function getClassPhotoAlt(
  photo: Pick<ClassPhoto, 'altEn' | 'altEs'>,
  locale: SupportedLocale
): string {
  return locale === 'es' ? photo.altEs : photo.altEn;
}
