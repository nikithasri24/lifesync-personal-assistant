# fetch-youtube-snippet Edge Function

This Supabase Edge Function proxies requests for YouTube video metadata so the LifeSync web client can import recipes without running into browser CORS restrictions.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | Yes (when using the YouTube Data API) | API key used when calling `https://www.googleapis.com/youtube/v3/videos`. |
| `YOUTUBE_API_BASE_URL` | No | Overrides the upstream endpoint. Defaults to the YouTube Data API `videos` endpoint. Set this to `https://yt.lemnoslife.com/videos?part=snippet` if you prefer the LemnosLife proxy. |
| `ALLOWED_ORIGINS` | No | Comma-separated list of origins allowed to call the function. Defaults to `*`. |

## Local development

```sh
supabase functions serve fetch-youtube-snippet \
  --env-file supabase/.env \
  --no-verify-jwt
```

The serve command watches the function and exposes it at `http://127.0.0.1:54321/functions/v1/fetch-youtube-snippet`. Update `VITE_YOUTUBE_SNIPPET_PROXY_URL` to point at that URL while developing.

## Deployment

```sh
supabase functions deploy fetch-youtube-snippet --project-ref <your-project-ref>
```

After deploying, configure the function environment variables in the Supabase dashboard (`Project Settings → Functions → Environment Variables`).

## Client configuration

Set `VITE_YOUTUBE_SNIPPET_PROXY_URL` to the live function URL, e.g.

```
VITE_YOUTUBE_SNIPPET_PROXY_URL=https://<project-ref>.functions.supabase.co/fetch-youtube-snippet
```

The client will append `?videoId=<id>` when calling the function.
