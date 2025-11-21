export interface ProductInfo {
  name: string;
  price?: number;
  category?: string;
  brand?: string;
  image?: string;
}

export async function lookupProductByBarcode(barcode: string): Promise<ProductInfo> {
  try {
    const resp = await fetch(`/api/barcode/lookup?code=${encodeURIComponent(barcode)}`, {
      headers: { Accept: 'application/json' }
    });

    if (!resp.ok) throw new Error('lookup failed');

    const data = await resp.json();
    return {
      name: data.name || `Product ${barcode.slice(-4)}`,
      price: typeof data.price === 'number' ? data.price : undefined,
      category: data.category || 'other',
      brand: data.brand || undefined,
      image: data.image || undefined,
    };
  } catch {
    return { name: `Product ${barcode.slice(-4)}`, category: 'other' };
  }
}
