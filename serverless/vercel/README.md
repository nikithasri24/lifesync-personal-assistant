# Vercel Serverless Functions for LifeSync

This directory contains reference implementations of serverless functions that should be deployed to Vercel to support LifeSync features.

## Available Functions

### 1. YouTube Snippet Fetcher (`fetch-youtube-snippet.ts`)

Fetches YouTube metadata from the server side and returns the JSON to the LifeSync client.

**Source:** `serverless/vercel/fetch-youtube-snippet.ts`
**Deploy to:** `/api/fetch-youtube-snippet.ts`
**Endpoint:** `https://<your-project>.vercel.app/api/fetch-youtube-snippet`

### 2. Recipe Clipper (`clip/recipe.ts`)

Extracts recipe data from web URLs by parsing JSON-LD schema and OpenGraph tags.

**Source:** Created in `/api/clip/recipe.ts` (already in correct location)
**Endpoint:** `https://<your-project>.vercel.app/api/clip/recipe`
**Documentation:** See `/api/clip/README.md` for detailed documentation

## File Layout

For Vercel deployment, your `api/` directory should have this structure:

```
/api/
├── fetch-youtube-snippet.ts
└── clip/
    └── recipe.ts
```

## Environment Variables

Set these in your Vercel project settings:

| Variable | Required | Function | Description |
| --- | --- | --- | --- |
| `YOUTUBE_API_KEY` | Yes* | YouTube Snippet | Your YouTube Data API v3 key |
| `YOUTUBE_API_BASE_URL` | No | YouTube Snippet | Override endpoint. Defaults to `https://www.googleapis.com/youtube/v3/videos` |
| `ALLOWED_ORIGINS` | No | Both | Comma-separated CORS origins. Defaults to `*` |

*Required if using YouTube Data API; optional if using alternative endpoint

## Frontend Environment Variables

Configure these in your LifeSync frontend (`.env.local` or Vercel project settings):

```bash
# YouTube snippet proxy
VITE_YOUTUBE_SNIPPET_PROXY_URL=https://<your-project>.vercel.app/api/fetch-youtube-snippet

# Recipe clipper (optional - defaults to /api/clip/recipe)
VITE_RECIPE_CLIPPER_URL=https://<your-project>.vercel.app/api/clip/recipe
```

## Deployment Steps

### First-Time Setup

1. Install the Vercel CLI (optional but useful):
   ```sh
   npm i -g vercel
   ```

2. Ensure the `api/` directory is at your project root with the correct structure

3. Link your repository to Vercel (if not already done):
   ```sh
   vercel link
   ```

4. Set environment variables in Vercel project settings:
   ```sh
   vercel env add YOUTUBE_API_KEY
   vercel env add ALLOWED_ORIGINS
   ```

5. Deploy to production:
   ```sh
   vercel deploy --prod
   ```

### After Deployment

6. Note the function URLs:
   ```
   https://<your-project>.vercel.app/api/fetch-youtube-snippet
   https://<your-project>.vercel.app/api/clip/recipe
   ```

7. Update your LifeSync frontend environment variables (see above)

8. Redeploy the frontend or restart the dev server to pick up changes

## Testing Locally

With Vercel CLI installed, run functions locally:

```sh
vercel dev
```

Functions will be accessible at:
- `http://localhost:3000/api/fetch-youtube-snippet`
- `http://localhost:3000/api/clip/recipe`

Configure your frontend `.env.local` for local development:

```bash
VITE_YOUTUBE_SNIPPET_PROXY_URL=http://localhost:3000/api/fetch-youtube-snippet
VITE_RECIPE_CLIPPER_URL=http://localhost:3000/api/clip/recipe
```

## Testing Individual Functions

### YouTube Snippet

```bash
curl "http://localhost:3000/api/fetch-youtube-snippet?videoId=dQw4w9WgXcQ"
```

### Recipe Clipper

```bash
curl "http://localhost:3000/api/clip/recipe?url=https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/"
```

## Troubleshooting

### Function Not Found (404)

- Verify the file is in the correct location under `/api/`
- Check that the file has a `.ts` extension
- Redeploy with `vercel deploy --prod`

### CORS Errors

- Set `ALLOWED_ORIGINS` environment variable with your frontend domain
- For local development, include `http://localhost:5173` (or your dev port)

### YouTube API Quota Exceeded

- Consider using the alternative endpoint: `https://yt.lemnoslife.com/videos?part=snippet`
- Set `YOUTUBE_API_BASE_URL` to the alternative endpoint

## Additional Documentation

- Recipe Clipper: `/api/clip/README.md`
- YouTube Snippet: See inline documentation in `fetch-youtube-snippet.ts`
