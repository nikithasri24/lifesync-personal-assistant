import type { VercelRequest, VercelResponse } from '@vercel/node';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function resolveAllowedOrigin(requestOrigin: string | undefined | null): string {
  const configured = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!configured || configured.length === 0 || configured.includes('*')) {
    return '*';
  }
  if (requestOrigin && configured.includes(requestOrigin)) {
    return requestOrigin;
  }
  return configured[0];
}

function buildCorsHeaders(requestOrigin: string | undefined | null) {
  return {
    ...baseCorsHeaders,
    'Access-Control-Allow-Origin': resolveAllowedOrigin(requestOrigin),
  } as Record<string, string>;
}

function sendJson(res: VercelResponse, status: number, body: JsonValue | { [key: string]: JsonValue }, headers: Record<string, string>) {
  res.setHeader('Content-Type', 'application/json');
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.status(status).send(JSON.stringify(body));
}

/**
 * Extract JSON-LD data from HTML
 */
function extractJsonLd(html: string): JsonValue[] {
  const jsonLdBlocks: JsonValue[] = [];
  // Match script tags with type="application/ld+json"
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      jsonLdBlocks.push(parsed);
    } catch {
      // Skip invalid JSON
      continue;
    }
  }

  return jsonLdBlocks;
}

/**
 * Find Recipe schema in JSON-LD data
 */
function findRecipeSchema(jsonLdBlocks: JsonValue[]): Record<string, JsonValue> | null {
  for (const block of jsonLdBlocks) {
    if (typeof block !== 'object' || block === null) continue;

    const obj = block as Record<string, JsonValue>;

    // Check if this is a Recipe type
    if (obj['@type'] === 'Recipe') {
      return obj;
    }

    // Check if it's an array of items (some sites use @graph)
    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        if (typeof item === 'object' && item !== null) {
          const graphItem = item as Record<string, JsonValue>;
          if (graphItem['@type'] === 'Recipe') {
            return graphItem;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Extract meta tag content
 */
function extractMetaTag(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Parse duration string (ISO 8601 duration format like PT30M or PT1H30M)
 */
function parseDuration(duration: unknown): number | undefined {
  if (typeof duration !== 'string') return undefined;

  // Match PT followed by hours and/or minutes
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(duration);
  if (!match) return undefined;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  return hours * 60 + minutes;
}

/**
 * Normalize ingredients from various formats
 */
function normalizeIngredients(ingredients: JsonValue): Array<{ name: string }> {
  if (Array.isArray(ingredients)) {
    return ingredients
      .map(item => {
        if (typeof item === 'string') {
          return { name: item };
        }
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, JsonValue>;
          // Handle HowToStep or other structured formats
          if (typeof obj.text === 'string') {
            return { name: obj.text };
          }
          if (typeof obj.name === 'string') {
            return { name: obj.name };
          }
        }
        return null;
      })
      .filter((item): item is { name: string } => item !== null);
  }

  if (typeof ingredients === 'string') {
    return [{ name: ingredients }];
  }

  return [];
}

/**
 * Normalize instructions from various formats
 */
function normalizeInstructions(instructions: JsonValue): string[] {
  if (Array.isArray(instructions)) {
    return instructions
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, JsonValue>;
          // Handle HowToStep format
          if (typeof obj.text === 'string') {
            return obj.text;
          }
          if (typeof obj.name === 'string') {
            return obj.name;
          }
        }
        return null;
      })
      .filter((item): item is string => item !== null && item.length > 0);
  }

  if (typeof instructions === 'string') {
    // Split by newlines if it's a single string
    return instructions.split(/\n+/).filter(line => line.trim().length > 0);
  }

  return [];
}

/**
 * Extract recipe data from JSON-LD schema or fallback to meta tags
 */
function parseRecipeData(html: string): Record<string, JsonValue> {
  // Try JSON-LD first
  const jsonLdBlocks = extractJsonLd(html);
  const recipeSchema = findRecipeSchema(jsonLdBlocks);

  if (recipeSchema) {
    // Extract data from Recipe schema
    const ingredients = normalizeIngredients(recipeSchema.recipeIngredient ?? recipeSchema.ingredients ?? []);
    const instructions = normalizeInstructions(recipeSchema.recipeInstructions ?? recipeSchema.instructions ?? []);

    return {
      name: recipeSchema.name ?? null,
      description: recipeSchema.description ?? null,
      ingredients,
      instructions,
      prepTime: parseDuration(recipeSchema.prepTime) ?? null,
      cookTime: parseDuration(recipeSchema.cookTime) ?? null,
      servings: typeof recipeSchema.recipeYield === 'number'
        ? recipeSchema.recipeYield
        : typeof recipeSchema.recipeYield === 'string'
          ? parseInt(recipeSchema.recipeYield, 10) || null
          : null,
      image: typeof recipeSchema.image === 'string'
        ? recipeSchema.image
        : Array.isArray(recipeSchema.image) && recipeSchema.image.length > 0 && typeof recipeSchema.image[0] === 'string'
          ? recipeSchema.image[0]
          : typeof recipeSchema.image === 'object' && recipeSchema.image !== null && typeof (recipeSchema.image as Record<string, JsonValue>).url === 'string'
            ? (recipeSchema.image as Record<string, JsonValue>).url
            : null,
      tags: Array.isArray(recipeSchema.keywords)
        ? recipeSchema.keywords.filter((k): k is string => typeof k === 'string')
        : typeof recipeSchema.keywords === 'string'
          ? recipeSchema.keywords.split(',').map(k => k.trim())
          : null,
    };
  }

  // Fallback to OpenGraph and meta tags
  const ogTitle = extractMetaTag(html, 'og:title');
  const ogDescription = extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description');
  const ogImage = extractMetaTag(html, 'og:image');

  // Extract title from HTML if no OG title
  let title = ogTitle;
  if (!title) {
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    title = titleMatch ? titleMatch[1] : null;
  }

  return {
    name: title,
    description: ogDescription,
    ingredients: [],
    instructions: [],
    prepTime: null,
    cookTime: null,
    servings: null,
    image: ogImage,
    tags: null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const corsHeaders = buildCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Content-Type', 'text/plain');
    for (const [key, value] of Object.entries(corsHeaders)) {
      res.setHeader(key, value);
    }
    res.status(200).send('ok');
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' }, corsHeaders);
    return;
  }

  // Extract URL from query params
  const url = typeof req.query.url === 'string'
    ? req.query.url
    : Array.isArray(req.query.url)
      ? req.query.url[0]
      : undefined;

  if (!url) {
    sendJson(res, 400, { error: 'Missing url parameter' }, corsHeaders);
    return;
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    sendJson(res, 400, { error: 'Invalid URL format' }, corsHeaders);
    return;
  }

  // Fetch the recipe page
  let htmlResponse: globalThis.Response;
  try {
    htmlResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LifeSync Recipe Clipper/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
  } catch (error) {
    sendJson(res, 502, { error: 'Failed to fetch URL', details: String(error) }, corsHeaders);
    return;
  }

  if (!htmlResponse.ok) {
    sendJson(res, htmlResponse.status, {
      error: 'Failed to fetch recipe page',
      status: htmlResponse.status,
      statusText: htmlResponse.statusText
    }, corsHeaders);
    return;
  }

  // Get HTML content
  const html = await htmlResponse.text();

  // Parse recipe data
  try {
    const recipeData = parseRecipeData(html);
    sendJson(res, 200, recipeData, corsHeaders);
  } catch (error) {
    sendJson(res, 500, { error: 'Failed to parse recipe data', details: String(error) }, corsHeaders);
    return;
  }
}
