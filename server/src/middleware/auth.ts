import type { RequestHandler } from 'express'

// Lightweight Supabase JWT extractor.
// In production, verify the signature against Supabase JWKS or via the Admin API.
// For now, we decode the payload without verification when NODE_ENV!=='production'.

interface JwtPayloadLike {
  sub?: string
  user_id?: string
  email?: string
  [key: string]: unknown
}

function decodeJwt(token: string): JwtPayloadLike | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string | null
  }
}

export const supabaseAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers['authorization'] || req.headers['Authorization']
  const auth = Array.isArray(header) ? header[0] : header
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined

  req.userId = null

  if (!token) {
    return next()
  }

  // NOTE: In production we should verify signature using Supabase JWKS.
  // For now, allow non-verified decode outside production to keep dev velocity.
  const devMode = process.env.NODE_ENV !== 'production'
  if (devMode) {
    const payload = decodeJwt(token)
    req.userId = (payload?.sub as string) || (payload?.user_id as string) || null
    return next()
  }

  // Production path (placeholder): still decode without trust.
  // Replace with verification using JWKS or Supabase Admin API.
  const payload = decodeJwt(token)
  req.userId = (payload?.sub as string) || (payload?.user_id as string) || null
  return next()
}

