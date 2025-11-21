#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Use global fetch if available (Node 18+), otherwise lazy import node-fetch
const fetchFn = typeof fetch === 'function' ? fetch : (await import('node-fetch')).default

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const url = 'https://restcountries.com/v3.1/all'
  const res = await fetchFn(url)
  if (!res.ok) throw new Error(`Failed to fetch countries: ${res.status} ${res.statusText}`)
  const data = await res.json()

  const out = (data || [])
    .map((c) => ({
      id: (c.cca3 || c.cca2 || c.ccn3 || c.cioc || c.name?.common || '').toLowerCase(),
      code: c.cca2,
      name: c.name?.common,
      continent: c.region || 'Other',
    }))
    .filter((c) => c.code && c.name)

  // De-dupe by code
  const seen = new Set()
  const deduped = []
  for (const c of out) {
    if (seen.has(c.code)) continue
    seen.add(c.code)
    deduped.push(c)
  }

  deduped.sort((a, b) => a.name.localeCompare(b.name))

  const outPath = path.resolve(__dirname, '../src/data/countries.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2))
  logger.info('Generate-countries', `Wrote ${deduped.length} countries to ${outPath}`);
}

main().catch((err) => {
  logger.error('Generate-countries', err);
  process.exit(1)
})

