// LifeSync Database Server
// Simple Express.js server to handle PostgreSQL operations from the React frontend

import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import { z } from 'zod';
import fetch from 'node-fetch';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;
const SKIP_DB = process.env.SKIP_DB === '1';

// Database connection (optional)
let pool;
if (!SKIP_DB) {
  const dbConfig = {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'lifesync',
    password: process.env.PGPASSWORD || 'lifesync123',
    port: Number(process.env.PGPORT || 5432),
    connectionTimeoutMillis: 5000,
  };
  pool = new Pool(dbConfig);
}

// Middleware
// CORS: restrict to allowed origins if provided
const rawOrigins = process.env.CORS_ORIGINS || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '15mb' }));

// If DB is disabled, block DB-backed API routes with 503
app.use((req, res, next) => {
  if (!SKIP_DB) return next();
  const path = req.path || '';
  // Allow proxy/utility routes without DB
  const allowed = [
    '/api/health',
    '/api/youtube/snippet',
    '/api/youtube/transcript',
    '/api/barcode/lookup',
    '/api/ocr/receipt',
    '/api/clip/recipe',
  ];
  if (allowed.some((p) => path.startsWith(p))) return next();
  return res.status(503).json({ error: 'Database is disabled (SKIP_DB=1)' });
});

// Test database connection (if enabled)
if (!SKIP_DB && pool) {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection failed:', err);
    } else {
      console.log('Connected to PostgreSQL database at:', res.rows[0].now);
    }
  });
} else {
  console.log('DB disabled (SKIP_DB=1). Running proxy-only/server utility routes.');
}

// Helpers
const withTimeout = async (promise, ms = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    // node-fetch supports AbortController
    // Caller should pass in fetch(url, { signal: controller.signal, ... })
    return await promise(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

const safeJson = async (resp) => {
  try { return await resp.json(); } catch { return null; }
};

// Validation Schemas
const TaskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  project_id: z.string().uuid().nullable().optional(),
  status: z.enum(['todo','done','waiting','scheduled','in_progress']).optional(),
  priority: z.enum(['low','medium','high','urgent']).optional(),
  estimated_time: z.number().int().nonnegative().optional(),
  actual_time: z.number().int().nonnegative().optional(),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['work','personal','learning','creative','health','other']).optional(),
  notes: z.string().optional(),
  starred: z.boolean().optional(),
  archived: z.boolean().optional(),
});
const TaskUpdateSchema = TaskCreateSchema.partial();

const ProjectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['active','completed','on_hold']).optional(),
  icon: z.string().optional(),
});
const ProjectUpdateSchema = ProjectCreateSchema.partial();

// Routes
// Simple proxy for YouTube snippet to avoid CORS in browser
app.get('/api/youtube/snippet', async (req, res) => {
  try {
    const rawVideoId = String(req.query.videoId || '').trim()
    const rawUrl = String(req.query.url || '').trim()
    const extractId = (u) => {
      try {
        const parsed = new URL(u)
        if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
        if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2]
        const v = parsed.searchParams.get('v')
        if (v) return v
        const m = u.match(/[?&]v=([0-9A-Za-z_-]{11})|(?:youtu\.be\/|shorts\/)([0-9A-Za-z_-]{11})/)
        return m ? (m[1] || m[2]) : null
      } catch { return null }
    }
    const videoId = rawVideoId || (rawUrl ? extractId(rawUrl) : '')
    if (!videoId) return res.status(400).json({ error: 'videoId required (or provide ?url=...)' })

    // Primary: yt.lemnoslife snippet
    const primary = `https://yt.lemnoslife.com/videos?part=snippet&id=${encodeURIComponent(videoId)}`
    const pResp = await withTimeout((signal) => fetch(primary, { headers: { 'Accept': 'application/json' }, signal }))
    if (pResp.ok) {
      const data = await safeJson(pResp)
      res.setHeader('Cache-Control', 'public, max-age=300')
      return res.json(data)
    }

    // Fallback: YouTube oEmbed (limited fields)
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    const oResp = await withTimeout((signal) => fetch(oembed, { headers: { 'Accept': 'application/json' }, signal }))
    if (oResp.ok) {
      const oe = await safeJson(oResp)
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

    const text = await pResp.text().catch(() => '')
    console.error('Upstream error (both snippet and oembed failed)', pResp.status, text)
    return res.status(502).json({ error: 'Upstream error', status: pResp.status })
  } catch (e) {
    console.error('YouTube snippet proxy failed', e)
    res.status(500).json({ error: 'Failed to fetch YouTube snippet' })
  }
});

// Fetch YouTube transcript by parsing captionTracks from the watch page
app.get('/api/youtube/transcript', async (req, res) => {
  try {
    const rawVideoId = String(req.query.videoId || '').trim();
    const rawUrl = String(req.query.url || '').trim();
    const extractId = (u) => {
      try {
        const parsed = new URL(u);
        if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
        if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2];
        const v = parsed.searchParams.get('v');
        if (v) return v;
        const m = u.match(/[?&]v=([0-9A-Za-z_-]{11})|(?:youtu\.be\/|shorts\/)([0-9A-Za-z_-]{11})/);
        return m ? (m[1] || m[2]) : null;
      } catch { return null; }
    };
    const videoId = rawVideoId || (rawUrl ? extractId(rawUrl) : '');
    if (!videoId) return res.status(400).json({ error: 'videoId required (or provide ?url=...)' });

    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const pageResp = await withTimeout((signal) => fetch(watchUrl, { headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0 (LifeSync Transcript)' }, signal }));
    if (!pageResp.ok) return res.status(502).json({ error: 'Failed to load watch page', status: pageResp.status });
    const html = await pageResp.text();

    // Extract ytInitialPlayerResponse JSON
    const iprMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});/);
    if (!iprMatch) return res.status(404).json({ error: 'Player response not found' });
    let player;
    try { player = JSON.parse(iprMatch[1]); } catch { return res.status(500).json({ error: 'Failed to parse player response' }); }
    const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (!tracks.length) return res.status(404).json({ error: 'No captions available' });

    // Pick language preference if provided, prefer manual over ASR when possible
    const pref = String(req.query.lang || 'en').toLowerCase();
    const score = (t) => {
      const lc = (t.languageCode || '').toLowerCase();
      const langMatch = lc.startsWith(pref) ? 2 : lc.startsWith('en') ? 1 : 0;
      const manual = t.kind === 'asr' ? 0 : 1; // prefer non-ASR (human) captions
      return langMatch * 10 + manual;
    };
    const track = tracks.slice().sort((a, b) => score(b) - score(a))[0];
    let baseUrl = track?.baseUrl;
    if (!baseUrl) return res.status(404).json({ error: 'Caption track missing baseUrl' });
    if (!/fmt=/.test(baseUrl)) baseUrl += (baseUrl.includes('?') ? '&' : '?') + 'fmt=json3';

    const capResp = await withTimeout((signal) => fetch(baseUrl, { headers: { 'Accept': 'application/json' }, signal }));
    if (!capResp.ok) return res.status(502).json({ error: 'Failed to fetch captions', status: capResp.status });
    const caps = await capResp.json();
    // json3 format has events[].segs[].utf8 and tStartMs/dDurationMs
    const events = Array.isArray(caps?.events) ? caps.events : [];
    const transcript = [];
    for (const ev of events) {
      const start = (ev.tStartMs || 0) / 1000;
      const dur = (ev.dDurationMs || 0) / 1000;
      const text = (ev.segs || []).map(s => s.utf8).join('').replace(/\n/g, ' ').trim();
      if (text) transcript.push({ start, dur, text });
    }
    return res.json({ videoId, language: track.languageCode, transcript });
  } catch (e) {
    console.error('YouTube transcript proxy failed', e);
    res.status(500).json({ error: 'Failed to fetch YouTube transcript' });
  }
});

// Barcode lookup proxy (Open Food Facts by default)
app.get('/api/barcode/lookup', async (req, res) => {
  try {
    const code = String(req.query.code || '').trim();
    if (!code) return res.status(400).json({ error: 'code query param required' });

    // Try Open Food Facts on multiple regional subdomains, then world
    const subdomains = ['us', 'world'];
    let p = null;
    for (const sub of subdomains) {
      const offUrl = `https://${sub}.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;
      try {
        const offResp = await withTimeout((signal) => fetch(offUrl, { headers: { 'Accept': 'application/json' }, signal }), 8000);
        if (!offResp.ok) continue;
        const data = await safeJson(offResp);
        if (data.status === 1 && data.product) { p = data.product; break; }
      } catch {}
    }
    if (!p) {
      // Graceful not found
      return res.json({ notFound: true, name: `Product ${code.slice(-4)}`, category: 'other' });
    }
    const name = p.product_name || p.generic_name || p.brands_tags?.[0] || 'Unknown product';
    // Coarse category mapping from OFF categories_tags
    const cats = Array.isArray(p.categories_tags) ? p.categories_tags.map((x) => String(x).toLowerCase()) : [];
    const mapCategory = () => {
      const any = (arr) => arr.some((k) => cats.some((c) => c.includes(k)));
      if (any(['fruits','vegetables','produce','greens'])) return 'produce';
      if (any(['dairy','cheese','milk','yogurt','butter'])) return 'dairy';
      if (any(['meat','fish','seafood','poultry'])) return 'meat';
      if (any(['bread','bakery'])) return 'bakery';
      if (any(['frozen'])) return 'frozen';
      if (any(['delicatessen','deli'])) return 'deli';
      if (any(['household'])) return 'household';
      if (any(['personal-care'])) return 'personal';
      if (any(['beverages','snacks','groceries','canned','cereals','pasta','sauces','oils','vinegars','condiments','rice','flours'])) return 'pantry';
      return 'other';
    };
    const normalized = {
      name,
      brand: p.brands || undefined,
      category: mapCategory(),
      price: undefined,
      image: p.image_front_small_url || p.image_url || undefined,
    };
    res.setHeader('Cache-Control', 'public, max-age=600');
    return res.json(normalized);
  } catch (e) {
    console.error('Barcode lookup failed', e);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});

// OCR endpoint (OCR.space proxy). Requires OCR_SPACE_API_KEY in env
app.post('/api/ocr/receipt', async (req, res) => {
  try {
    const { dataUrl, imageUrl } = req.body || {};
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'Missing OCR API key. Set OCR_SPACE_API_KEY in env.' });

    let payload; let endpoint = 'https://api.ocr.space/parse/image';
    const form = new URLSearchParams();
    form.set('language', 'eng');
    form.set('isTable', 'false');
    form.set('OCREngine', '2');
    if (dataUrl && String(dataUrl).startsWith('data:')) {
      form.set('base64Image', String(dataUrl));
    } else if (imageUrl) {
      form.set('url', String(imageUrl));
    } else {
      return res.status(400).json({ error: 'Provide dataUrl (base64) or imageUrl' });
    }

    const resp = await withTimeout((signal) => fetch(endpoint, {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal,
    }), 20000);
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return res.status(502).json({ error: 'OCR upstream error', status: resp.status, text });
    }
    const data = await resp.json();
    const parsed = Array.isArray(data?.ParsedResults) ? data.ParsedResults.map((p) => p?.ParsedText || '').join('\n') : '';
    return res.json({ text: parsed || '' });
  } catch (e) {
    console.error('OCR receipt failed', e);
    res.status(500).json({ error: 'Failed to run OCR' });
  }
});

// Simple recipe clipper (server-side fetch + JSON-LD/OG parse)
app.get('/api/clip/recipe', async (req, res) => {
  try {
    const url = String(req.query.url || '').trim();
    if (!url) return res.status(400).json({ error: 'url query param required' });

    const resp = await withTimeout((signal) => fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (LifeSync Recipe Clipper)' }, signal }), 15000);
    if (!resp.ok) {
      return res.status(502).json({ error: 'Failed to fetch page', status: resp.status });
    }
    const html = await resp.text();

    const out = { name: '', description: '', image: undefined, ingredients: [], instructions: [], prepTime: undefined, cookTime: undefined, servings: undefined, authorName: undefined };

    // Helpers
    const parseDurationToMinutes = (value) => {
      if (!value || typeof value !== 'string') return undefined;
      // ISO 8601 durations like PT1H30M or PT45M
      const m = value.match(/P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
      if (!m) return undefined;
      const hours = parseInt(m[1] || '0', 10);
      const minutes = parseInt(m[2] || '0', 10);
      const seconds = parseInt(m[3] || '0', 10);
      return hours * 60 + minutes + (seconds ? Math.round(seconds / 60) : 0);
    };

    const pick = (v) => Array.isArray(v) ? v[0] : v;
    const textArray = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) {
        return v.map((x) => (typeof x === 'string' ? x : (x && (x.text || x.name)) || '')).filter(Boolean);
      }
      if (typeof v === 'string') return v.split(/\r?\n|\.|;/).map(s => s.trim()).filter(Boolean);
      if (typeof v === 'object' && v) return [(v.text || v.name || '')].filter(Boolean);
      return [];
    };

    // Try JSON-LD
    const ldMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let recipeNode = null;
    const tryParseJSON = (s) => { try { return JSON.parse(s); } catch { return null; } };

    for (const m of ldMatches) {
      const raw = (m[1] || '').trim();
      if (!raw) continue;
      const parsed = tryParseJSON(raw);
      if (!parsed) continue;
      const flatten = (obj) => {
        if (!obj) return [];
        if (Array.isArray(obj)) return obj.flatMap(flatten);
        if (obj['@graph']) return flatten(obj['@graph']);
        return [obj];
      };
      const nodes = flatten(parsed);
      const found = nodes.find((n) => {
        const t = n['@type'];
        if (!t) return false;
        if (typeof t === 'string') return t.toLowerCase() === 'recipe';
        if (Array.isArray(t)) return t.map(String).some((x) => x.toLowerCase() === 'recipe');
        return false;
      });
      if (found) { recipeNode = found; break; }
    }

    if (recipeNode) {
      out.name = pick(recipeNode.name) || out.name;
      out.description = pick(recipeNode.description) || out.description;
      out.image = pick(recipeNode.image) || out.image;
      const ings = recipeNode.recipeIngredient || recipeNode.ingredients;
      out.ingredients = (Array.isArray(ings) ? ings : (typeof ings === 'string' ? ings.split(/\r?\n|,/) : [])).map((s) => String(s).trim()).filter(Boolean);
      const instr = recipeNode.recipeInstructions || recipeNode.instructions;
      out.instructions = textArray(instr);
      out.prepTime = parseDurationToMinutes(recipeNode.prepTime);
      out.cookTime = parseDurationToMinutes(recipeNode.cookTime);
      const ry = pick(recipeNode.recipeYield);
      if (ry) { const n = String(ry).match(/\d+/); out.servings = n ? parseInt(n[0], 10) : undefined; }
      const author = recipeNode.author;
      out.authorName = (Array.isArray(author) ? pick(author.map(a => a && (a.name || a))) : (author && (author.name || author))) || undefined;
    }

    // Fallback OG/meta
    const og = (prop) => {
      const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
      const m = html.match(re); return m ? m[1] : undefined;
    };
    const ogTitle = og('og:title') || og('twitter:title');
    const ogDesc = og('og:description') || og('twitter:description');
    const ogImage = og('og:image') || og('twitter:image');
    if (!out.name) {
      out.name = ogTitle || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
    }
    if (!out.description) out.description = ogDesc || '';
    if (!out.image) out.image = ogImage;

    // Normalize and respond
    const result = {
      name: out.name || 'Clipped Recipe',
      description: out.description || '',
      image: out.image,
      ingredients: out.ingredients.map((s) => ({ name: s })),
      instructions: out.instructions.length ? out.instructions : [],
      prepTime: out.prepTime ?? 10,
      cookTime: out.cookTime ?? 20,
      servings: out.servings ?? 2,
      difficulty: 'medium',
      tags: ['clipped'],
      sourceType: 'manual',
      sourceUrl: url,
      authorName: out.authorName,
    };

    res.setHeader('Cache-Control', 'no-store');
    return res.json(result);
  } catch (e) {
    console.error('Clip recipe failed', e);
    res.status(500).json({ error: 'Failed to clip recipe' });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, p.name as project_name, p.color as project_color, p.icon as project_icon
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.deleted = false
      ORDER BY COALESCE(t.position, 2147483647) ASC, t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Reorder tasks: accepts { order: [{ id, position }] }
app.post('/api/tasks/reorder', async (req, res) => {
  try {
    const body = req.body || {};
    const order = Array.isArray(body.order) ? body.order : [];
    if (order.length === 0) return res.status(400).json({ error: 'order array required' });

    // Validate entries
    for (const item of order) {
      if (!item || typeof item.id !== 'string' || typeof item.position !== 'number') {
        return res.status(400).json({ error: 'Invalid order item. Expected { id: string, position: number }' });
      }
    }

    // Update positions in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { id, position } of order) {
        await client.query('UPDATE tasks SET position = $1, updated_at = NOW() WHERE id = $2', [position, id]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.json({ success: true, updated: order.length });
  } catch (err) {
    console.error('Error reordering tasks:', err);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const parsed = TaskCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid task payload', details: parsed.error.flatten() });
    }
    const { title, description, project_id, status, priority, estimated_time, actual_time, due_date, tags, category, notes, starred, archived } = parsed.data;
    const result = await pool.query(`
      INSERT INTO tasks (
        title, description, project_id, status, priority, estimated_time,
        actual_time, due_date, tags, category, notes, starred, archived
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      title, description, project_id, status || 'todo', priority || 'medium',
      estimated_time || 25, actual_time || 0, due_date, tags || [],
      category || 'other', notes, starred || false, archived || false
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = TaskUpdateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid task update payload', details: parsed.error.flatten() });
    }
    const updates = parsed.data;
    // Whitelist fields to prevent SQL injection via keys
    const allowed = new Set([
      'title','description','project_id','status','priority','estimated_time','actual_time','due_date','tags','category','notes','starred','archived','parent_id','completed_at','attachments','assigned_to','deleted','deleted_at'
    ]);
    const entries = Object.entries(updates).filter(([k]) => allowed.has(k));
    if (entries.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    const fields = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await pool.query(`
      UPDATE tasks SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task (soft delete)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE tasks SET deleted = true, deleted_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Restore task
app.post('/api/tasks/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE tasks SET deleted = false, deleted_at = NULL
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error restoring task:', err);
    res.status(500).json({ error: 'Failed to restore task' });
  }
});

// Permanently delete task
app.delete('/api/tasks/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      DELETE FROM tasks WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task permanently deleted', task: result.rows[0] });
  } catch (err) {
    console.error('Error permanently deleting task:', err);
    res.status(500).json({ error: 'Failed to permanently delete task' });
  }
});

// Create project
app.post('/api/projects', async (req, res) => {
  try {
    const parsed = ProjectCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid project payload', details: parsed.error.flatten() });
    }
    const { name, description, color, status, icon } = parsed.data;

    const result = await pool.query(`
      INSERT INTO projects (name, description, color, status, icon)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, color || '#6366f1', status || 'active', icon || '📁']);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = ProjectUpdateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid project update payload', details: parsed.error.flatten() });
    }
    const updates = parsed.data;
    const allowed = new Set(['name','description','color','status','icon']);
    const entries = Object.entries(updates).filter(([k]) => allowed.has(k));
    if (entries.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    const fields = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const result = await pool.query(`
      UPDATE projects SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `, [...values, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update tasks to remove project reference
    await pool.query('UPDATE tasks SET project_id = NULL WHERE project_id = $1', [id]);
    
    // Delete project
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted', project: result.rows[0] });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ==================== HABITS API ====================
const HabitCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  frequency: z.enum(['daily','weekly','monthly']).optional(),
  target_value: z.number().int().positive().optional(),
  unit: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

app.get('/api/habits', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, COUNT(he.id) as total_entries, MAX(he.date) as last_entry_date
      FROM habits h
      LEFT JOIN habit_entries he ON h.id = he.habit_id
      WHERE h.is_active = true
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching habits:', err);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

app.post('/api/habits', async (req, res) => {
  try {
    const parsed = HabitCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid habit payload', details: parsed.error.flatten() });
    }
    const { name, description, category, frequency, target_value, unit, color, icon } = parsed.data;
    const result = await pool.query(`
      INSERT INTO habits (name, description, category, frequency, target_value, unit, color, icon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, description, category, frequency || 'daily', target_value || 1, unit, color || '#10b981', icon || '✅']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating habit:', err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.post('/api/habits/:id/entries', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, value, notes, mood } = req.body || {};
    const result = await pool.query(`
      INSERT INTO habit_entries (habit_id, date, value, notes, mood)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (habit_id, date)
      DO UPDATE SET value = EXCLUDED.value, notes = EXCLUDED.notes, mood = EXCLUDED.mood
      RETURNING *
    `, [id, date || new Date().toISOString().split('T')[0], value || 1, notes, mood]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating habit entry:', err);
    res.status(500).json({ error: 'Failed to create habit entry' });
  }
});

// ==================== FINANCES API ====================
app.get('/api/financial/accounts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM financial_accounts WHERE is_active = true ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching financial accounts:', err);
    res.status(500).json({ error: 'Failed to fetch financial accounts' });
  }
});

const FinancialTxCreateSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  type: z.enum(['income','expense','transfer']),
  amount: z.number(),
  description: z.string().optional(),
  payee: z.string().optional(),
  date: z.string(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

app.get('/api/financial/transactions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, a.name as account_name, c.name as category_name, c.color as category_color
      FROM financial_transactions t
      LEFT JOIN financial_accounts a ON t.account_id = a.id
      LEFT JOIN financial_categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching financial transactions:', err);
    res.status(500).json({ error: 'Failed to fetch financial transactions' });
  }
});

app.post('/api/financial/transactions', async (req, res) => {
  try {
    const parsed = FinancialTxCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid transaction payload', details: parsed.error.flatten() });
    }
    const { account_id, category_id, type, amount, description, payee, date, tags, notes } = parsed.data;
    const result = await pool.query(`
      INSERT INTO financial_transactions (account_id, category_id, type, amount, description, payee, date, tags, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [account_id, category_id, type, amount, description, payee, date, tags || [], notes]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating financial transaction:', err);
    res.status(500).json({ error: 'Failed to create financial transaction' });
  }
});

// ==================== SHOPPING API ====================
const ShoppingListCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active','completed','archived']).optional(),
  total_estimated_cost: z.number().optional(),
  total_actual_cost: z.number().optional(),
  store: z.string().optional(),
  shopping_date: z.string().optional(),
});

app.get('/api/shopping/lists', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM shopping_lists ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shopping lists:', err);
    res.status(500).json({ error: 'Failed to fetch shopping lists' });
  }
});

app.post('/api/shopping/lists', async (req, res) => {
  try {
    const parsed = ShoppingListCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid shopping list payload', details: parsed.error.flatten() });
    }
    const { name, description, status, total_estimated_cost, total_actual_cost, store, shopping_date } = parsed.data;
    const result = await pool.query(`
      INSERT INTO shopping_lists (name, description, status, total_estimated_cost, total_actual_cost, store, shopping_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, description, status || 'active', total_estimated_cost, total_actual_cost, store, shopping_date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating shopping list:', err);
    res.status(500).json({ error: 'Failed to create shopping list' });
  }
});

const ShoppingItemCreateSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  estimated_price: z.number().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  notes: z.string().optional(),
});

app.get('/api/shopping/lists/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM shopping_items WHERE shopping_list_id = $1 ORDER BY position, created_at
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shopping items:', err);
    res.status(500).json({ error: 'Failed to fetch shopping items' });
  }
});

app.post('/api/shopping/lists/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = ShoppingItemCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid shopping item payload', details: parsed.error.flatten() });
    }
    const { name, quantity, unit, estimated_price, category, brand, notes } = parsed.data;
    const result = await pool.query(`
      INSERT INTO shopping_items (shopping_list_id, name, quantity, unit, estimated_price, category, brand, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, name, quantity || 1, unit, estimated_price, category, brand, notes]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding shopping item:', err);
    res.status(500).json({ error: 'Failed to add shopping item' });
  }
});

// ==================== FOCUS SESSIONS API ====================
const FocusSessionCreateSchema = z.object({
  task_id: z.string().uuid().optional(),
  preset: z.string().min(1),
  duration: z.number().int().positive(),
  start_time: z.string().optional(),
  mood_before: z.string().optional(),
  notes: z.string().optional(),
  environment_data: z.any().optional(),
});
const FocusSessionUpdateSchema = FocusSessionCreateSchema.extend({
  end_time: z.string().optional(),
  status: z.enum(['active','completed','cancelled','paused']).optional(),
  breaks_taken: z.number().int().nonnegative().optional(),
  distractions: z.number().int().nonnegative().optional(),
  mood_after: z.string().optional(),
  productivity_score: z.number().int().min(0).max(100).optional(),
  actual_duration: z.number().int().nonnegative().optional(),
}).partial();

app.get('/api/focus/sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT fs.*, t.title as task_title
      FROM focus_sessions fs
      LEFT JOIN tasks t ON fs.task_id = t.id
      ORDER BY fs.start_time DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching focus sessions:', err);
    res.status(500).json({ error: 'Failed to fetch focus sessions' });
  }
});

app.post('/api/focus/sessions', async (req, res) => {
  try {
    const parsed = FocusSessionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid focus session payload', details: parsed.error.flatten() });
    }
    const { task_id, preset, duration, start_time, mood_before, notes, environment_data } = parsed.data;
    const result = await pool.query(`
      INSERT INTO focus_sessions (task_id, preset, duration, start_time, mood_before, notes, environment_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [task_id, preset, duration, start_time || new Date(), mood_before, notes, environment_data]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating focus session:', err);
    res.status(500).json({ error: 'Failed to create focus session' });
  }
});

app.put('/api/focus/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = FocusSessionUpdateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid focus session update payload', details: parsed.error.flatten() });
    }
    const updates = parsed.data || {};
    const allowed = new Set([
      'task_id','preset','duration','start_time','mood_before','notes','environment_data','end_time','status','breaks_taken','distractions','mood_after','productivity_score','actual_duration'
    ]);
    const entries = Object.entries(updates).filter(([k]) => allowed.has(k));
    if (entries.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    const fields = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const result = await pool.query(`
      UPDATE focus_sessions SET ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1}
      RETURNING *
    `, [...values, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Focus session not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating focus session:', err);
    res.status(500).json({ error: 'Failed to update focus session' });
  }
});

// ==================== RECIPES + ANALYTICS ====================
const RecipeCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  difficulty: z.string().optional(),
  prep_time: z.number().optional(),
  cook_time: z.number().optional(),
  servings: z.number().optional(),
  calories_per_serving: z.number().optional(),
  instructions: z.any().optional(),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().optional(),
});

app.get('/api/recipes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, COUNT(ri.id) as ingredient_count
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.post('/api/recipes', async (req, res) => {
  try {
    const parsed = RecipeCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid recipe payload', details: parsed.error.flatten() });
    }
    const { name, description, cuisine, difficulty, prep_time, cook_time, servings, calories_per_serving, instructions, tags, is_favorite } = parsed.data;
    const result = await pool.query(`
      INSERT INTO recipes (
        name, description, cuisine, difficulty, prep_time, cook_time,
        servings, calories_per_serving, instructions, tags, is_favorite
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [name, description, cuisine, difficulty || 'medium', prep_time, cook_time, servings || 4, calories_per_serving, instructions, tags || [], is_favorite || false]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const [tasks, habits, transactions, sessions] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'done' THEN 1 END) as completed FROM tasks WHERE deleted = false"),
      pool.query('SELECT COUNT(*) as total FROM habits WHERE is_active = true'),
      pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses FROM financial_transactions WHERE date >= CURRENT_DATE - INTERVAL '30 days'"),
      pool.query("SELECT COUNT(*) as total, SUM(actual_duration) as total_focus_time FROM focus_sessions WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'")
    ]);
    res.json({ tasks: tasks.rows[0], habits: habits.rows[0], finance: transactions.rows[0], focus: sessions.rows[0] });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 LifeSync API server running at http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});

export default app;
