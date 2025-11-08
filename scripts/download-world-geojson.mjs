#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const url = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'
  console.log('Downloading world countries GeoJSON from:', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed HTTP ${res.status} ${res.statusText}`)
  const json = await res.json()

  const outPath = path.resolve(__dirname, '../public/world-countries.geo.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(json))
  console.log('Saved to', outPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

