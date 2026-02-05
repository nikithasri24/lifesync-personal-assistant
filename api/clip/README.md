# Recipe Clipper Serverless Function

This serverless function extracts recipe data from web URLs by parsing JSON-LD schema data and OpenGraph meta tags.

## Endpoint

```
/api/clip/recipe
```

## Method

`GET`

## Query Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `url` | Yes | The URL of the recipe page to extract data from |

## Example Request

```
GET /api/clip/recipe?url=https://example.com/recipe/chocolate-chip-cookies
```

## Response Format

Returns a JSON object with the following structure:

```json
{
  "name": "Chocolate Chip Cookies",
  "description": "The best chocolate chip cookies you'll ever make",
  "ingredients": [
    { "name": "2 cups all-purpose flour" },
    { "name": "1 tsp baking soda" },
    { "name": "1 cup butter, softened" }
  ],
  "instructions": [
    "Preheat oven to 350°F",
    "Mix dry ingredients in a bowl",
    "Cream butter and sugars together"
  ],
  "prepTime": 15,
  "cookTime": 12,
  "servings": 24,
  "image": "https://example.com/images/cookies.jpg",
  "tags": ["dessert", "cookies", "baking"]
}
```

## Field Descriptions

- **name**: Recipe title (string or null)
- **description**: Recipe description (string or null)
- **ingredients**: Array of ingredient objects with `name` field
- **instructions**: Array of instruction strings
- **prepTime**: Preparation time in minutes (number or null)
- **cookTime**: Cooking time in minutes (number or null)
- **servings**: Number of servings (number or null)
- **image**: URL to recipe image (string or null)
- **tags**: Array of tag strings (array or null)

## How It Works

1. **JSON-LD Parsing**: The function first attempts to extract recipe data from JSON-LD structured data (Schema.org Recipe format)
2. **OpenGraph Fallback**: If no JSON-LD data is found, it falls back to OpenGraph meta tags
3. **Data Normalization**: Handles various formats for ingredients and instructions

## Supported Recipe Formats

The clipper supports:
- Schema.org `Recipe` type in JSON-LD
- `@graph` arrays containing Recipe objects
- OpenGraph meta tags as fallback
- ISO 8601 duration formats (PT30M, PT1H30M)
- Multiple ingredient/instruction formats (strings, arrays, HowToStep objects)

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed CORS origins. Defaults to `*` |

## Error Responses

### 400 Bad Request
```json
{ "error": "Missing url parameter" }
{ "error": "Invalid URL format" }
```

### 405 Method Not Allowed
```json
{ "error": "Method not allowed" }
```

### 502 Bad Gateway
```json
{ "error": "Failed to fetch URL", "details": "..." }
```

### 500 Internal Server Error
```json
{ "error": "Failed to parse recipe data", "details": "..." }
```

## Deployment

### Vercel

1. Ensure the file is located at `/api/clip/recipe.ts` in your repository
2. Deploy to Vercel (automatically detects serverless functions in `/api` directory)
3. The function will be available at: `https://<your-project>.vercel.app/api/clip/recipe`

### Environment Configuration

Set the endpoint URL in your frontend environment:

```bash
VITE_RECIPE_CLIPPER_URL=https://<your-project>.vercel.app/api/clip/recipe
```

If not set, the frontend defaults to `/api/clip/recipe` (relative path).

## Testing Locally

With Vercel CLI:

```bash
vercel dev
```

The endpoint will be available at:
```
http://localhost:3000/api/clip/recipe?url=https://example.com/recipe
```

## Example cURL

```bash
curl "http://localhost:3000/api/clip/recipe?url=https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/"
```

## Common Recipe Sites Supported

This clipper works with most modern recipe websites that implement:
- Schema.org Recipe markup
- JSON-LD structured data
- OpenGraph meta tags

Examples:
- AllRecipes
- Food Network
- Bon Appétit
- Serious Eats
- NYT Cooking
- And many more!
