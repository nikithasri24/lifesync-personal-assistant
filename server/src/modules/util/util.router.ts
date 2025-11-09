import { Router } from 'express'
import fetch from 'node-fetch'
import { validate } from '../../middleware/validate.js'
import { z } from 'zod'

export const utilRouter = Router()

// Simple in-memory rate limiter per IP
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE || 60)
const buckets = new Map<string, { count: number; resetAt: number }>()

function takeToken(ip: string): boolean {
  const now = Date.now()
  const key = ip || 'unknown'
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (bucket.count >= RATE_LIMIT_PER_MINUTE) return false
  bucket.count += 1
  return true
}

utilRouter.use((req: any, res: any, next: any) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || ''
  if (!takeToken(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }
  next()
})

// ========== YouTube snippet (oEmbed fallback) ==========
const youtubeQuery = z.object({
  videoId: z.string().optional(),
  url: z.string().url().optional(),
})

utilRouter.get(
  '/youtube/snippet',
  validate({ query: youtubeQuery }),
  async (req: any, res: any) => {
    const { videoId: rawVideoId, url: rawUrl } = req.query as any

    const extractId = (u: string) => {
      try {
        const parsed = new URL(u)
        if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
        if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2]
        const v = parsed.searchParams.get('v')
        if (v) return v
        const m = u.match(/[?&]v=([0-9A-Za-z_-]{11})|(?:youtu\.be\/|shorts\/)([0-9A-Za-z_-]{11})/)
        return m ? (m[1] || m[2]) : null
      } catch {
        return null
      }
    }

    const videoId = rawVideoId || (rawUrl ? extractId(rawUrl) : '')
    if (!videoId) return res.status(400).json({ error: 'videoId required (or provide ?url=...)' })

    const primary = `https://yt.lemnoslife.com/videos?part=snippet&id=${encodeURIComponent(videoId)}`
    try {
      const pResp = await fetch(primary, { headers: { Accept: 'application/json' } })
      if (pResp.ok) {
        const data = await pResp.json()
        res.setHeader('Cache-Control', 'public, max-age=300')
        return res.json(data)
      }
      const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
      const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
      const oResp = await fetch(oembed, { headers: { Accept: 'application/json' } })
      if (oResp.ok) {
        const oe: any = await oResp.json()
        const normalized = {
          items: [
            {
              snippet: {
                title: oe.title,
                description: '',
                thumbnails: { medium: { url: oe.thumbnail_url }, default: { url: oe.thumbnail_url } },
                channelTitle: oe.author_name,
              },
            },
          ],
        }
        res.setHeader('Cache-Control', 'public, max-age=300')
        return res.json(normalized)
      }
      return res.status(502).json({ error: 'Upstream error', status: pResp.status })
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch YouTube snippet' })
    }
  }
)

// ========== YouTube transcript (caption json3) ==========
utilRouter.get(
  '/youtube/transcript',
  validate({ query: youtubeQuery }),
  async (req: any, res: any) => {
    const { videoId: rawVideoId, url: rawUrl } = req.query as any
    const extractId = (u: string) => {
      try {
        const parsed = new URL(u)
        if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
        if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2]
        const v = parsed.searchParams.get('v')
        if (v) return v
        const m = u.match(/[?&]v=([0-9A-Za-z_-]{11})|(?:youtu\.be\/|shorts\/)([0-9A-Za-z_-]{11})/)
        return m ? (m[1] || m[2]) : null
      } catch {
        return null
      }
    }
    const videoId = rawVideoId || (rawUrl ? extractId(rawUrl) : '')
    if (!videoId) return res.status(400).json({ error: 'videoId required (or provide ?url=...)' })

    try {
      const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
      const pageResp = await fetch(watchUrl, { headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'LifeSync Transcript' } })
      if (!pageResp.ok) return res.status(502).json({ error: 'Failed to load watch page', status: pageResp.status })
      const html = await pageResp.text()
      const iprMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});/)
      if (!iprMatch) return res.status(404).json({ error: 'Player response not found' })
      let player: any
      try {
        player = JSON.parse(iprMatch[1])
      } catch {
        return res.status(500).json({ error: 'Failed to parse player response' })
      }
      const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || []
      if (!tracks.length) return res.status(404).json({ error: 'No captions available' })

      const pref = String((req.query as any).lang || 'en').toLowerCase()
      const score = (t: any) => {
        const lc = String(t.languageCode || '').toLowerCase()
        const langMatch = lc.startsWith(pref) ? 2 : lc.startsWith('en') ? 1 : 0
        const manual = t.kind === 'asr' ? 0 : 1
        return langMatch * 10 + manual
      }
      const track = tracks.slice().sort((a: any, b: any) => score(b) - score(a))[0]
      let baseUrl: string | undefined = track?.baseUrl
      if (!baseUrl) return res.status(404).json({ error: 'Caption track missing baseUrl' })
      if (!/fmt=/.test(baseUrl)) baseUrl += (baseUrl.includes('?') ? '&' : '?') + 'fmt=json3'

      const capResp = await fetch(baseUrl, { headers: { Accept: 'application/json' } })
      if (!capResp.ok) return res.status(502).json({ error: 'Failed to fetch captions', status: capResp.status })
      const caps: any = await capResp.json()
      const events = Array.isArray(caps?.events) ? caps.events : []
      const transcript: Array<{ start: number; dur: number; text: string }> = []
      for (const ev of events) {
        const start = (ev.tStartMs || 0) / 1000
        const dur = (ev.dDurationMs || 0) / 1000
        const text = (ev.segs || []).map((s: any) => s.utf8).join('').replace(/\n/g, ' ').trim()
        if (text) transcript.push({ start, dur, text })
      }
      return res.json({ videoId, language: track.languageCode, transcript })
    } catch {
      return res.status(500).json({ error: 'Failed to fetch YouTube transcript' })
    }
  }
)

// ========== Barcode lookup (Open Food Facts) ==========
const barcodeQuery = z.object({ code: z.string().min(6) })

utilRouter.get(
  '/barcode/lookup',
  validate({ query: barcodeQuery }),
  async (req: any, res: any) => {
    const { code } = req.query as any
    const subs = ['us', 'world']
    let product: any = null
    for (const sub of subs) {
      try {
        const offUrl = `https://${sub}.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`
        const offResp = await fetch(offUrl, { headers: { Accept: 'application/json' } })
        if (!offResp.ok) continue
        const data: any = await offResp.json()
        if (data.status === 1 && data.product) { product = data.product; break }
      } catch {}
    }
    if (!product) {
      return res.json({ notFound: true, name: `Product ${code.slice(-4)}`, category: 'other' })
    }
    const name = product.product_name || product.generic_name || product.brands_tags?.[0] || 'Unknown product'
    const cats: string[] = Array.isArray(product.categories_tags) ? product.categories_tags.map((x: any) => String(x).toLowerCase()) : []
    const anyMatch = (arr: string[]) => arr.some((k) => cats.some((c) => c.includes(k)))
    const category = anyMatch(['fruits','vegetables','produce','greens']) ? 'produce'
      : anyMatch(['dairy','cheese','milk','yogurt','butter']) ? 'dairy'
      : anyMatch(['meat','fish','seafood','poultry']) ? 'meat'
      : anyMatch(['bread','bakery']) ? 'bakery'
      : anyMatch(['frozen']) ? 'frozen'
      : anyMatch(['delicatessen','deli']) ? 'deli'
      : anyMatch(['household']) ? 'household'
      : anyMatch(['personal-care']) ? 'personal'
      : anyMatch(['beverages','snacks','groceries','canned','cereals','pasta','sauces','oils','vinegars','condiments','rice','flours']) ? 'pantry'
      : 'other'

    const normalized = {
      name,
      brand: product.brands || undefined,
      category,
      price: undefined,
      image: product.image_front_small_url || product.image_url || undefined,
    }
    res.setHeader('Cache-Control', 'public, max-age=600')
    return res.json(normalized)
  }
)

// ========== OCR Receipt ==========
const ocrBody = z.object({
  dataUrl: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

utilRouter.post(
  '/ocr/receipt',
  validate({ body: ocrBody }),
  async (req: any, res: any) => {
    const { dataUrl, imageUrl } = req.body as any
    const apiKey = process.env.OCR_SPACE_API_KEY
    if (!apiKey) return res.status(400).json({ error: 'Missing OCR API key. Set OCR_SPACE_API_KEY in env.' })
    if (!dataUrl && !imageUrl) return res.status(400).json({ error: 'Provide dataUrl (base64) or imageUrl' })

    const form = new URLSearchParams()
    form.set('language', 'eng')
    form.set('isTable', 'false')
    form.set('OCREngine', '2')
    if (dataUrl && dataUrl.startsWith('data:')) form.set('base64Image', dataUrl)
    else if (imageUrl) form.set('url', imageUrl)

    try {
      const resp = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { apikey: apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        return res.status(502).json({ error: 'OCR upstream error', status: resp.status, text })
      }
      const data: any = await resp.json()
      const parsed = Array.isArray(data?.ParsedResults) ? data.ParsedResults.map((p: any) => p?.ParsedText || '').join('\n') : ''
      return res.json({ text: parsed || '' })
    } catch {
      return res.status(500).json({ error: 'Failed to call OCR service' })
    }
  }
)
