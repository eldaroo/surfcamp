import productDocument from '@/docs/lobbypms-products.json';

export interface LobbyPMSProductSpec {
  serviceId: number;
  name: string;
  value: string;
  infiniteInventory: boolean;
  stock: number | null;
}

interface RawProductDocument {
  data: Array<{
    service_id: number;
    name: string;
    value: string;
    infinite_inventory: number;
    stock: number | null;
  }>;
}

const castedDocument = productDocument as RawProductDocument;

export const LOBBYPMS_PRODUCT_CATALOG: LobbyPMSProductSpec[] = castedDocument.data.map((item) => ({
  serviceId: item.service_id,
  name: item.name.trim(),
  value: item.value,
  infiniteInventory: item.infinite_inventory === 1,
  stock: item.stock
}));

export const LOBBYPMS_PRODUCT_MAP = new Map<number, LobbyPMSProductSpec>(
  LOBBYPMS_PRODUCT_CATALOG.map((item) => [item.serviceId, item])
);

type SurfClassCount = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type ActivityProductMapping = {
  defaultProductId?: string;
  packages?: Record<string, string>;
  classCounts?: Partial<Record<number, string>>;
  programs?: Record<string, string>; // For surf program mapping (fundamental, progressionPlus, highPerformance)
};

export const LOBBYPMS_ACTIVITY_PRODUCTS: Record<string, ActivityProductMapping> = {
  'yoga-package': {
    packages: {
      '1-class': '219724',
      '3-classes': '219726',
      '10-classes': '219727'
    }
  },
  'surf-package': {
    // Program-based mapping (new system)
    programs: {
      'fundamental': '488396',        // Core Surf program (1-4 classes)
      'progressionPlus': '489528',    // Intensive Surf Program (5-6 classes)
      'highPerformance': '489529'     // Elite Surf Program (8+ classes)
    },
    // Legacy class-count mapping (for backwards compatibility)
    // Matches classCountToProgram logic: <=4 → fundamental, <=6 → progressionPlus, >=8 → highPerformance
    classCounts: {
      3: '488396',  // fundamental (Core)
      4: '488396',  // fundamental (Core)
      5: '489528',  // progressionPlus (Intensive)
      6: '489528',  // progressionPlus (Intensive)
      // 7 is a gap in the logic (returns null)
      8: '489529',  // highPerformance (Elite)
      9: '489529',  // highPerformance (Elite)
      10: '489529'  // highPerformance (Elite)
    }
  },
  'ice-bath-session': {
    defaultProductId: '465954'
  },
  'hosting-service': {
    defaultProductId: '494398'
  }
};

interface LookupOptions {
  package?: string | null;
  classCount?: number | null;
  surfProgram?: string | null; // Add support for surf program names
}

export function lookupActivityProductId(
  activityId: string,
  { package: packageName, classCount, surfProgram }: LookupOptions = {}
): string | undefined {
  const mapping = LOBBYPMS_ACTIVITY_PRODUCTS[activityId];
  if (!mapping) {
    return undefined;
  }

  // NEW: Check for surf program mapping first (fundamental, progressionPlus, highPerformance)
  if (surfProgram && 'programs' in mapping && mapping.programs) {
    const programMatch = mapping.programs[surfProgram];
    if (programMatch) {
      console.log(`✅ [LOBBYPMS-PRODUCTS] Mapped surf program "${surfProgram}" → product ID ${programMatch}`);
      return programMatch;
    }
  }

  const normalizedPackage = packageName?.toLowerCase();

  if (normalizedPackage && mapping.packages) {
    const directMatch = mapping.packages[normalizedPackage];
    if (directMatch) {
      return directMatch;
    }
  }

  const normalizedCount = classCount ?? (normalizedPackage ? parseInt(normalizedPackage, 10) : undefined);

  if (Number.isFinite(normalizedCount) && normalizedCount && mapping.classCounts) {
    const classMatch = mapping.classCounts[normalizedCount];
    if (classMatch) {
      return classMatch;
    }
  }

  return mapping.defaultProductId;
}

export function isSupportedSurfClassCount(value: number): value is SurfClassCount {
  return value >= 3 && value <= 10;
}
