import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ApiResponseBody = {
  error?: string;
  status?: number;
  details?: JsonValue;
  data?: JsonValue;
};

const baseCorsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function resolveAllowedOrigin(requestOrigin: string | null): string {
  const configured = Deno.env.get("ALLOWED_ORIGINS")?.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (!configured || configured.length === 0 || configured.includes("*")) {
    return "*";
  }
  if (requestOrigin && configured.includes(requestOrigin)) {
    return requestOrigin;
  }
  return configured[0];
}

function buildCorsHeaders(requestOrigin: string | null) {
  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": resolveAllowedOrigin(requestOrigin),
  } as Record<string, string>;
}

function jsonResponse(body: ApiResponseBody | JsonValue, status: number, headers: Record<string, string>) {
  const payload = typeof body === "object" ? JSON.stringify(body) : String(body);
  return new Response(payload, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

async function handleRequest(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  const apiBaseUrl = Deno.env.get("YOUTUBE_API_BASE_URL") ?? "https://www.googleapis.com/youtube/v3/videos";

  if (!apiBaseUrl) {
    return jsonResponse({ error: "Server misconfiguration: missing API base URL" }, 500, corsHeaders);
  }

  let videoId: string | undefined;

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      videoId = url.searchParams.get("videoId") ?? undefined;
    } else {
      const body = await req.json().catch(() => null) as { videoId?: string } | null;
      videoId = body?.videoId;
    }
  } catch (error) {
    return jsonResponse({ error: "Invalid request payload", details: String(error) }, 400, corsHeaders);
  }

  if (!videoId) {
    return jsonResponse({ error: "Missing videoId" }, 400, corsHeaders);
  }

  const upstreamUrl = new URL(apiBaseUrl);
  if (!upstreamUrl.searchParams.has("part")) {
    upstreamUrl.searchParams.set("part", "snippet");
  }
  upstreamUrl.searchParams.set("id", videoId);

  const isYoutubeDataApi = upstreamUrl.host.endsWith("googleapis.com");
  if (isYoutubeDataApi) {
    if (!apiKey) {
      return jsonResponse({ error: "Server misconfiguration: missing YOUTUBE_API_KEY" }, 500, corsHeaders);
    }
    upstreamUrl.searchParams.set("key", apiKey);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    return jsonResponse({
      error: "Upstream request failed",
      details: String(error),
    }, 502, corsHeaders);
  }

  const textPayload = await upstreamResponse.text();

  if (!upstreamResponse.ok) {
    return new Response(textPayload, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json",
        ...corsHeaders,
      },
    });
  }

  return new Response(textPayload, {
    status: 200,
    headers: {
      "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json",
      ...corsHeaders,
    },
  });
}

serve(handleRequest);
