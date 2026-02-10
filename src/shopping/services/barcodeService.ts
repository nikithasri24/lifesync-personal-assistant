import { NetworkError, ValidationError } from '../../lib/errors';
import { logger } from '../../services/logger';

export interface ProductInfo {
  name: string;
  price?: number;
  category?: string;
  brand?: string;
  image?: string;
}

interface BarcodeAPIResponse {
  name?: string;
  price?: number;
  category?: string;
  brand?: string;
  image?: string;
}

function isBarcodeAPIResponse(data: unknown): data is BarcodeAPIResponse {
  return typeof data === 'object' && data !== null;
}

export async function lookupProductByBarcode(barcode: string): Promise<ProductInfo> {
  try {
    const resp = await fetch(`/api/barcode/lookup?code=${encodeURIComponent(barcode)}`, {
      headers: { Accept: 'application/json' }
    });

    if (!resp.ok) {
      logger.warn('BarcodeService', 'Barcode lookup failed', { barcode, status: resp.status });
      throw new NetworkError('Barcode lookup failed', { barcode, status: resp.status });
    }

    const rawData: unknown = await resp.json();

    if (!isBarcodeAPIResponse(rawData)) {
      logger.error('BarcodeService', 'Invalid API response from barcode service', { barcode, rawData });
      throw new ValidationError('Invalid API response from barcode service', undefined, { barcode });
    }

    const data: BarcodeAPIResponse = rawData;

    return {
      name: data.name ?? `Product ${barcode.slice(-4)}`,
      price: typeof data.price === 'number' ? data.price : undefined,
      category: data.category ?? 'other',
      brand: data.brand ?? undefined,
      image: data.image ?? undefined,
    };
  } catch (error) {
    logger.error('BarcodeService', error instanceof Error ? error : new Error(String(error)), {
      context: 'lookupProductByBarcode',
      barcode,
    });
    // Return fallback product info instead of throwing
    return {
      name: `Product ${barcode.slice(-4)}`,
      category: 'other'
    };
  }
}
