#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  // Public dataset of US states boundaries (GeoJSON)
  const url = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
  console.log('Downloading US states GeoJSON from:', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed HTTP ${res.status} ${res.statusText}`)
  const json = await res.json()
  const outPath = path.resolve(__dirname, '../public/us-states.geo.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(json))
  console.log('Saved to', outPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

