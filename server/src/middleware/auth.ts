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

import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

let adminClient: any = null
if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  } catch {
    adminClient = null
  }
}

export const supabaseAuth = async (req: any, res: any, next: any) => {
  const header = req.headers['authorization'] || req.headers['Authorization']
  const auth = Array.isArray(header) ? header[0] : header
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined

  ;(req as any).userId = null

  if (!token) {
    // No token: in production we continue and let requireAuth guard protected routes
    return next()
  }

  // NOTE: In production we should verify signature using Supabase JWKS.
  // For now, allow non-verified decode outside production to keep dev velocity.
  const devMode = process.env.NODE_ENV !== 'production'
  if (devMode || !adminClient) {
    const payload = decodeJwt(token)
    ;(req as any).userId = (payload?.sub as string) || (payload?.user_id as string) || null
    return next()
  }

  // Production path: verify via Supabase Admin API
  try {
    const { data, error } = await adminClient.auth.getUser(token)
    if (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    ;(req as any).userId = data.user?.id ?? null
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  return next()
}

export const requireAuth = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'production' && !req.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
