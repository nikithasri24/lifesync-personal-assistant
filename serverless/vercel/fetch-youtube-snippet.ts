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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    res.setHeader('Content-Type', 'text/plain');
    for (const [key, value] of Object.entries(corsHeaders)) {
      res.setHeader(key, value);
    }
    res.status(200).send('ok');
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' }, corsHeaders);
    return;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  const apiBaseUrl = process.env.YOUTUBE_API_BASE_URL ?? 'https://www.googleapis.com/youtube/v3/videos';

  let videoId: string | undefined;

  try {
    if (req.method === 'GET') {
      videoId = typeof req.query.videoId === 'string' ? req.query.videoId : Array.isArray(req.query.videoId) ? req.query.videoId[0] : undefined;
    } else {
      videoId = typeof req.body?.videoId === 'string' ? req.body.videoId : undefined;
    }
  } catch (error) {
    sendJson(res, 400, { error: 'Invalid request payload', details: String(error) }, corsHeaders);
    return;
  }

  if (!videoId) {
    sendJson(res, 400, { error: 'Missing videoId' }, corsHeaders);
    return;
  }

  const upstreamUrl = new URL(apiBaseUrl);
  if (!upstreamUrl.searchParams.has('part')) {
    upstreamUrl.searchParams.set('part', 'snippet');
  }
  upstreamUrl.searchParams.set('id', videoId);

  const isYoutubeDataApi = upstreamUrl.host.endsWith('googleapis.com');
  if (isYoutubeDataApi) {
    if (!apiKey) {
      sendJson(res, 500, { error: 'Server misconfiguration: missing YOUTUBE_API_KEY' }, corsHeaders);
      return;
    }
    upstreamUrl.searchParams.set('key', apiKey);
  }

  let upstreamResponse: globalThis.Response;
  try {
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    sendJson(res, 502, { error: 'Upstream request failed', details: String(error) }, corsHeaders);
    return;
  }

  const textPayload = await upstreamResponse.text();
  const contentType = upstreamResponse.headers.get('content-type') ?? 'application/json';

  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }
  res.setHeader('Content-Type', contentType);

  res.status(upstreamResponse.status).send(textPayload);
}
