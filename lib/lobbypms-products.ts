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
    classCounts: {
      3: '488396',
      4: '489528',
      5: '489529',
      6: '489530',
      7: '489532',
      8: '489533',
      9: '489534',
      10: '489536'
    }
  },
  'ice-bath-session': {
    defaultProductId: '465954'
  }
};

interface LookupOptions {
  package?: string | null;
  classCount?: number | null;
}

export function lookupActivityProductId(
  activityId: string,
  { package: packageName, classCount }: LookupOptions = {}
): string | undefined {
  const mapping = LOBBYPMS_ACTIVITY_PRODUCTS[activityId];
  if (!mapping) {
    return undefined;
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
