/**
 * OpenFoodFacts Service
 * Provides barcode lookup and food search using the OpenFoodFacts API
 * https://world.openfoodfacts.org/
 */

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  image_url?: string;
  image_front_small_url?: string;
  serving_size?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
  };
  nutrition_grade_fr?: string;
}

export interface NutritionInfo {
  name: string;
  brand?: string;
  barcode: string;
  imageUrl?: string;
  servingSize?: string;
  caloriesPer100g: number;
  caloriesPerServing?: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  nutritionGrade?: string;
}

const BASE_URL = 'https://world.openfoodfacts.org';

class OpenFoodFactsService {
  /**
   * Look up a product by barcode
   */
  async lookupBarcode(barcode: string): Promise<NutritionInfo | null> {
    try {
      const response = await fetch(`${BASE_URL}/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status !== 1 || !data.product) {
        return null;
      }

      return this.transformProduct(data.product, barcode);
    } catch (error) {
      console.error('OpenFoodFacts barcode lookup failed:', error);
      return null;
    }
  }

  /**
   * Search for products by name
   */
  async searchProducts(query: string, page = 1): Promise<{ products: NutritionInfo[]; totalCount: number }> {
    try {
      const params = new URLSearchParams({
        search_terms: query,
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: '20',
        page: String(page),
        fields: 'code,product_name,brands,image_front_small_url,serving_size,nutriments,nutrition_grade_fr',
      });

      const response = await fetch(`${BASE_URL}/cgi/search.pl?${params}`);
      const data = await response.json();

      const products = (data.products || [])
        .filter((p: OpenFoodFactsProduct) => p.product_name && p.nutriments)
        .map((p: OpenFoodFactsProduct) => this.transformProduct(p, p.code));

      return {
        products,
        totalCount: data.count || 0,
      };
    } catch (error) {
      console.error('OpenFoodFacts search failed:', error);
      return { products: [], totalCount: 0 };
    }
  }

  private transformProduct(product: OpenFoodFactsProduct, barcode: string): NutritionInfo {
    const n = product.nutriments || {};
    return {
      name: product.product_name || 'Unknown Product',
      brand: product.brands,
      barcode,
      imageUrl: product.image_front_small_url || product.image_url,
      servingSize: product.serving_size,
      caloriesPer100g: n['energy-kcal_100g'] || 0,
      caloriesPerServing: n['energy-kcal_serving'],
      proteinPer100g: n.proteins_100g || 0,
      carbsPer100g: n.carbohydrates_100g || 0,
      fatPer100g: n.fat_100g || 0,
      fiberPer100g: n.fiber_100g,
      sugarPer100g: n.sugars_100g,
      nutritionGrade: product.nutrition_grade_fr?.toUpperCase(),
    };
  }
}

export const openFoodFactsService = new OpenFoodFactsService();

