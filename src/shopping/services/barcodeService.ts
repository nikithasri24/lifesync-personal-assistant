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

    if (!resp.ok) throw new Error('lookup failed');

    const rawData: unknown = await resp.json();

    if (!isBarcodeAPIResponse(rawData)) {
      throw new Error('Invalid API response');
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
    // Log error for debugging purposes
    if (error instanceof Error) {
      // Error logged: Product lookup failed
    }
    return {
      name: `Product ${barcode.slice(-4)}`,
      category: 'other'
    };
  }
}
