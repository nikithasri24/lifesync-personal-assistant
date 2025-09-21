# Vercel Serverless Proxy: fetch-youtube-snippet

Deploy this function to Vercel to fetch YouTube metadata from the server side and return the JSON to the LifeSync client.

## File layout

```
/api/fetch-youtube-snippet.ts
```

In your Vercel project repository, place `fetch-youtube-snippet.ts` inside the `api/` directory at the project root. If you are deploying from this repository, configure Vercel to use the repo and set the project’s root directory (if needed) so that the `api` folder is included in the build output.

## Environment variables

Set these in your Vercel project settings:

| Variable | Required | Description |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | Yes (for YouTube Data API) | Your YouTube Data API v3 key. |
| `YOUTUBE_API_BASE_URL` | No | Override the upstream endpoint. Defaults to `https://www.googleapis.com/youtube/v3/videos`. You can set this to `https://yt.lemnoslife.com/videos?part=snippet`. |
| `ALLOWED_ORIGINS` | No | Comma-separated list of origins allowed to consume the proxy. Defaults to `*`. |

## Deployment steps

1. Install the Vercel CLI (optional but useful):
   ```sh
   npm i -g vercel
   ```
2. Copy `serverless/vercel/fetch-youtube-snippet.ts` into your project’s `api/` directory. The path on Vercel must be `/api/fetch-youtube-snippet.ts`.
3. Push the changes to the Git repository linked to your Vercel project, or deploy manually with:
   ```sh
   vercel deploy --prod
   ```
4. After the deploy finishes, note the function URL. It will look like:
   ```
   https://<your-project>.vercel.app/api/fetch-youtube-snippet
   ```
5. Update your LifeSync app’s environment configuration (`.env` or Vercel project env) to point to the new endpoint:
   ```
   VITE_YOUTUBE_SNIPPET_PROXY_URL=https://<your-project>.vercel.app/api/fetch-youtube-snippet
   ```
6. Restart the Vite dev server (or redeploy the frontend) so it picks up the new environment variable.

## Testing locally

With Vercel CLI installed, you can run the function locally:

```sh
vercel dev
```

The proxy will be accessible at `http://localhost:3000/api/fetch-youtube-snippet`. Configure `VITE_YOUTUBE_SNIPPET_PROXY_URL` accordingly during local development.
