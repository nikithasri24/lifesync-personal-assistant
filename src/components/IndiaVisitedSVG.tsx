import React, { useEffect, useRef, useState } from 'react'

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>

const WIDTH = 1000
const HEIGHT = 560

const DEFAULT_BOUNDS = { minLon: 68.0, maxLon: 98.0, minLat: 6.0, maxLat: 38.0 }

const project = (lon: number, lat: number, b = DEFAULT_BOUNDS): [number, number] => {
  const x = ((lon - b.minLon) / (b.maxLon - b.minLon)) * WIDTH
  const y = ((b.maxLat - lat) / (b.maxLat - b.minLat)) * HEIGHT
  return [x, y]
}

const buildPath = (geom: GeoJSON.Geometry, b?: typeof DEFAULT_BOUNDS): string => {
  const parts: string[] = []
  if (geom.type === 'Polygon') {
    const coords = geom.coordinates as number[][][]
    for (const ring of coords) {
      let first = true
      for (const [lon, lat] of ring) {
        const [x, y] = project(lon, lat, b)
        parts.push(first ? `M ${x} ${y}` : `L ${x} ${y}`)
        first = false
      }
      parts.push('Z')
    }
  } else if (geom.type === 'MultiPolygon') {
    const polys = geom.coordinates as number[][][][]
    for (const poly of polys) {
      for (const ring of poly) {
        let first = true
        for (const [lon, lat] of ring) {
          const [x, y] = project(lon, lat, b)
          parts.push(first ? `M ${x} ${y}` : `L ${x} ${y}`)
          first = false
        }
        parts.push('Z')
      }
    }
  }
  return parts.join(' ')
}

const MINIMAL_IN: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'India' }, geometry: { type: 'Polygon', coordinates: [[[68, 6], [68, 38], [98, 38], [98, 6], [68, 6]]] } },
  ],
}

const NAME_TO_CODE: Record<string, string> = {
  'andhra pradesh': 'AP', 'arunachal pradesh': 'AR', 'assam': 'AS', 'bihar': 'BR', 'chhattisgarh': 'CT',
  'goa': 'GA', 'gujarat': 'GJ', 'haryana': 'HR', 'himachal pradesh': 'HP', 'jharkhand': 'JH',
  'karnataka': 'KA', 'kerala': 'KL', 'madhya pradesh': 'MP', 'maharashtra': 'MH', 'manipur': 'MN',
  'meghalaya': 'ML', 'mizoram': 'MZ', 'nagaland': 'NL', 'odisha': 'OR', 'punjab': 'PB', 'rajasthan': 'RJ',
  'sikkim': 'SK', 'tamil nadu': 'TN', 'telangana': 'TS', 'tripura': 'TR', 'uttar pradesh': 'UP', 'uttarakhand': 'UK', 'west bengal': 'WB',
  // UTs
  'andaman and nicobar islands': 'AN', 'chandigarh': 'CH', 'dadra and nagar haveli and daman and diu': 'DN',
  'delhi': 'DL', 'jammu and kashmir': 'JK', 'ladakh': 'LA', 'lakshadweep': 'LD', 'puducherry': 'PY'
}

const IndiaVisitedSVG: React.FC = () => {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null)
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS)
  const [fallbackUsed, setFallbackUsed] = useState(false)
  const [visited, setVisited] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:visitedIN'), parsed: unknown = raw ? JSON.parse(raw) : []
      const codes = Array.isArray(parsed) ? parsed : []
      return new Set(codes.map((c: unknown) => String(c).toUpperCase()))
    } catch { return new Set() }
  })
  const saveVisited = (s: Set<string>): void => {
    try { localStorage.setItem('lifesync:travel:visitedIN', JSON.stringify(Array.from(s))) } catch { /* Ignore localStorage errors */ }
  }

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const res = await fetch('/india-states.geo.json', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as GeoJSON.FeatureCollection
        if (!cancelled) { setData(json); setFallbackUsed(false) }
        try {
          let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
          for (const f of json.features as GeoFeature[]) {
            const each = (coords: unknown): void => {
              if (Array.isArray(coords) && typeof coords[0] === 'number') {
                const [lon, lat] = coords as [number, number]
                minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon)
                minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
                return
              }
              if (Array.isArray(coords)) { for (const c of coords) each(c) }
            }
            const g = f.geometry
            if (g && 'coordinates' in g) each(g.coordinates)
          }
          if (isFinite(minLon) && isFinite(maxLon) && isFinite(minLat) && isFinite(maxLat)) setBounds({ minLon, maxLon, minLat, maxLat })
        } catch { /* Ignore bounds calculation errors */ }
      } catch {
        if (!cancelled) { setData(MINIMAL_IN); setFallbackUsed(true) }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [lastPt, setLastPt] = useState<{ x: number; y: number } | null>(null)
  const [vel, setVel] = useState({ x: 0, y: 0 })
  const [lastTs, setLastTs] = useState<number | null>(null)
  const [inertiaId, setInertiaId] = useState<number | null>(null)
  const clampScale = (v: number): number => Math.max(0.5, Math.min(8, v))
  const clampPan = (p: { x: number; y: number }, s: number): { x: number; y: number } => {
    const minX = Math.min(0, WIDTH - WIDTH * s), maxX = Math.max(0, WIDTH - WIDTH * s)
    const minY = Math.min(0, HEIGHT - HEIGHT * s), maxY = Math.max(0, HEIGHT - HEIGHT * s)
    return { x: Math.max(minX, Math.min(maxX, p.x)), y: Math.max(minY, Math.min(maxY, p.y)) }
  }
  const toSvgPoint = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>): { x: number; y: number } => {
    const svg = evt.currentTarget, r = svg.getBoundingClientRect()
    return { x: evt.clientX - r.left, y: evt.clientY - r.top }
  }
  const handleWheel = (evt: React.WheelEvent<SVGSVGElement>): void => {
    evt.preventDefault(); const f = evt.deltaY < 0 ? 1.1 : 0.9
    const nativeEvt = evt.nativeEvent as MouseEvent & { offsetX?: number; offsetY?: number }
    const p0 = { x: nativeEvt.offsetX ?? 0, y: nativeEvt.offsetY ?? 0 }, ns = clampScale(scale * f), k = ns / scale
    const np = { x: p0.x - (p0.x - pan.x) * k, y: p0.y - (p0.y - pan.y) * k }
    setScale(ns); setPan(clampPan(np, ns))
  }
  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>): void => {
    setPanning(true); setLastPt(toSvgPoint(e)); setVel({ x: 0, y: 0 }); setLastTs(performance.now())
    if (inertiaId !== null) { cancelAnimationFrame(inertiaId); setInertiaId(null) }
  }
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>): void => {
    if (!panning || !lastPt) return
    const pt = toSvgPoint(e), dx = pt.x - lastPt.x, dy = pt.y - lastPt.y
    const now = performance.now(), dt = lastTs !== null ? Math.max(16, now - lastTs) : 16
    setLastTs(now); setVel({ x: dx / dt, y: dy / dt })
    setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy }, scale)); setLastPt(pt)
  }
  const endPan = (): void => {
    setPanning(false); setLastPt(null); setLastTs(null)
    const friction = 0.95, minSpeed = 0.02
    const step = (): void => {
      setPan((p) => clampPan({ x: p.x + vel.x * 16, y: p.y + vel.y * 16 }, scale))
      setVel((v) => ({ x: v.x * friction, y: v.y * friction }))
      if (Math.hypot(vel.x, vel.y) > minSpeed) {
        setInertiaId(requestAnimationFrame(step))
      } else {
        if (inertiaId !== null) cancelAnimationFrame(inertiaId)
        setInertiaId(null)
      }
    }
    if (Math.hypot(vel.x, vel.y) > minSpeed) setInertiaId(requestAnimationFrame(step))
  }
  const zoomBy = (m: number): void => {
    const p0 = { x: WIDTH / 2, y: HEIGHT / 2 }, ns = clampScale(scale * m), k = ns / scale
    const np = { x: p0.x - (p0.x - pan.x) * k, y: p0.y - (p0.y - pan.y) * k }
    setScale(ns); setPan(clampPan(np, ns))
  }
  const resetView = (): void => {
    setScale(1); setPan({ x: 0, y: 0 })
    if (inertiaId !== null) { cancelAnimationFrame(inertiaId); setInertiaId(null) }
  }

  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null)
  const [meta, setMeta] = useState<Record<string, { notes?: string; photos?: string[] }>>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:inMeta'), parsed: unknown = raw ? JSON.parse(raw) : {}
      return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, { notes?: string; photos?: string[] }> : {}
    } catch { return {} }
  })
  const saveMeta = (next: Record<string, { notes?: string; photos?: string[] }>): void => {
    setMeta(next)
    try { localStorage.setItem('lifesync:travel:inMeta', JSON.stringify(next)) } catch { /* Ignore localStorage errors */ }
  }
  const getPointer = (evt: React.MouseEvent): { x: number; y: number } => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return { x: evt.clientX - r.left, y: evt.clientY - r.top }
  }

  const codeOf = (props: Record<string, unknown>): string => {
    const codeVal = (props.code ?? props.abbrev ?? props.STUSPS ?? props.state_code ?? '') as string | number
    const c = String(codeVal).toUpperCase(); if (c) return c
    const nameVal = (props.name ?? props.NAME ?? props.st_nm ?? props.state ?? '') as string | number
    const name = String(nameVal).toLowerCase()
    return NAME_TO_CODE[name] ?? name.toUpperCase().slice(0, 2)
  }
  const nameOf = (props: Record<string, unknown>): string =>
    String((props.name ?? props.NAME ?? props.st_nm ?? props.state ?? 'Unknown') as string | number)

  const features = (data?.features as GeoFeature[] | undefined) ?? []

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: HEIGHT }}>
      <svg
        ref={svgRef}
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onDoubleClick={() => zoomBy(1.2)}
        style={{ cursor: panning ? 'grabbing' : 'grab' }}
      >
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#F8FAFC" />
        <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
          {features.map((f, idx) => {
            const props: Record<string, unknown> = f.properties ?? {}
            const code = codeOf(props)
            const name = nameOf(props)
            const d = f.geometry ? buildPath(f.geometry, bounds) : ''
            if (!d) return null
            const isVisited = code ? visited.has(code) : false
            return (
              <path
                key={idx}
                d={d}
                fill={isVisited ? '#22C55E' : '#60A5FA'}
                fillOpacity={isVisited ? 0.65 : 0.28}
                stroke="#1F2937"
                strokeWidth={isVisited ? 0.8 : 0.5}
                vectorEffect="non-scaling-stroke"
                onClick={() => {
                  const next = new Set(visited)
                  if (isVisited) next.delete(code)
                  else next.add(code)
                  setVisited(next)
                  saveVisited(next)
                }}
                onDoubleClick={() => setSelected({ code, name })}
                onMouseEnter={(e) => {
                  const pt = getPointer(e)
                  setHover({ name, x: pt.x + 12, y: pt.y + 12 })
                }}
                onMouseMove={(e) => {
                  const pt = getPointer(e)
                  setHover((h) => (h ? { ...h, x: pt.x + 12, y: pt.y + 12 } : { name, x: pt.x + 12, y: pt.y + 12 }))
                }}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </g>
      </svg>

      <div className="absolute z-[1000] top-3 right-3 bg-white/90 backdrop-blur rounded-md border border-gray-200 shadow flex flex-col">
        <button className="px-2 py-1 text-sm hover:bg-gray-50 border-b" onClick={() => zoomBy(1.2)}>+</button>
        <button className="px-2 py-1 text-sm hover:bg-gray-50 border-b" onClick={() => zoomBy(1/1.2)}>−</button>
        <button className="px-2 py-1 text-xs hover:bg-gray-50" onClick={resetView}>Reset</button>
      </div>
      {hover && (
        <div className="pointer-events-none absolute bg-white/95 border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 shadow" style={{ left: hover.x, top: hover.y }}>
          {hover.name} <span className="text-[10px] text-gray-500 ml-2">(double‑click to edit)</span>
        </div>
      )}
      <div className="absolute z-[1000] bottom-3 right-3 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow px-3 py-2 text-xs text-gray-700">
        <div className="flex items-center space-x-2 mb-1"><span className="inline-block w-3 h-3 rounded-sm opacity-40" style={{ background: '#9CA3AF' }} /><span>Filtered out</span></div>
        <div className="flex items-center space-x-2 mb-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#60A5FA' }} /><span>Not visited</span></div>
        <div className="flex items-center space-x-2"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#22C55E' }} /><span>Visited</span></div>
      </div>

      <div className="absolute z-[1000] bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 shadow flex items-center overflow-hidden">
        <button className="px-3 py-2 text-xs hover:bg-gray-50 border-r" onClick={() => {
            try {
              const arr = Array.from(visited), blob = new Blob([JSON.stringify({ visited: arr, meta }, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob), a = document.createElement('a')
              a.href = url; a.download = 'visited-india.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
            } catch { /* Ignore export errors */ }
          }}>Export JSON</button>
        <button className="px-3 py-2 text-xs hover:bg-gray-50 border-r" onClick={() => {
            void (async (): Promise<void> => {
              try {
                const svg = svgRef.current; if (!svg) return
                const clone = svg.cloneNode(true) as SVGSVGElement; clone.setAttribute('width', String(WIDTH)); clone.setAttribute('height', String(HEIGHT))
                const ser = new XMLSerializer(), str = ser.serializeToString(clone), blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' })
                const url = URL.createObjectURL(blob), img = new Image()
                await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url })
                const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT
                const ctx = canvas.getContext('2d'); if (!ctx) return
                ctx.fillStyle = '#F8FAFC'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url)
                const pngUrl = canvas.toDataURL('image/png'), a = document.createElement('a')
                a.href = pngUrl; a.download = 'india-map.png'; document.body.appendChild(a); a.click(); a.remove()
              } catch { /* Ignore export errors */ }
            })()
          }}>Export PNG</button>
        <label className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 border-r">Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={(e) => {
              void (async (): Promise<void> => {
                const file = e.target.files?.[0]; if (!file) return
                try {
                  const text = await file.text(), json: unknown = JSON.parse(text)
                  if (typeof json === 'object' && json !== null) {
                    const obj = json as { visited?: unknown; meta?: unknown }
                    if (Array.isArray(obj.visited)) { const s = new Set(obj.visited.map((c: unknown) => String(c).toUpperCase())); setVisited(s); saveVisited(s) }
                    if (obj.meta && typeof obj.meta === 'object') saveMeta(obj.meta as Record<string, { notes?: string; photos?: string[] }>)
                  }
                } catch { /* Ignore import errors */ }
                e.currentTarget.value = ''
              })()
            }} />
        </label>
        <div className="px-3 py-2 text-[11px] text-gray-700 dark:text-gray-300">
          {(() => {
            const total = features.length, vcount = visited.size, pct = total ? Math.round((vcount / total) * 100) : 0
            return `${vcount}/${total} (${pct}%) visited`
          })()}
        </div>
      </div>

      {selected && (
        <div className="absolute inset-y-0 right-0 z-[1100] w-full max-w-sm bg-white border-l border-gray-200 shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">India State/UT</div>
              <div className="text-lg font-semibold text-gray-900">{selected.name}</div>
              <div className="text-xs text-gray-500">Code: {selected.code}</div>
            </div>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="p-4 space-y-4 overflow-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Visited</span>
              <button className={`px-3 py-1.5 text-xs rounded ${visited.has(selected.code) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`} onClick={() => {
                  const next = new Set(visited)
                  if (visited.has(selected.code)) next.delete(selected.code); else next.add(selected.code)
                  setVisited(next); saveVisited(next)
                }}>{visited.has(selected.code) ? 'Yes' : 'No'}</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="w-full h-28 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={meta[selected.code]?.notes ?? ''} onChange={(e) => {
                  const next = { ...meta, [selected.code]: { ...meta[selected.code], notes: e.target.value } }
                  saveMeta(next)
                }} placeholder="Memories, places, dates…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo URLs</label>
              <PhotoList items={meta[selected.code]?.photos ?? []} onChange={(list) => {
                  const next = { ...meta, [selected.code]: { ...meta[selected.code], photos: list } }
                  saveMeta(next)
                }} />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end"><button className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50" onClick={() => setSelected(null)}>Close</button></div>
        </div>
      )}

      {fallbackUsed && (<div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 text-xs text-amber-700 border border-amber-300 rounded px-3 py-1.5 shadow">Using minimal fallback. Run <code>npm run data:download:india-geojson</code> then reload.</div>)}
    </div>
  )
}

export default IndiaVisitedSVG

function PhotoList({ items, onChange }: { items: string[]; onChange: (next: string[]) => void }): React.ReactElement {
  const [value, setValue] = useState('')
  const add = (): void => { const v = value.trim(); if (!v) return; onChange([...items, v]); setValue('') }
  const remove = (idx: number): void => { const next = [...items]; next.splice(idx, 1); onChange(next) }
  return (
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700" onClick={add}>Add</button>
      </div>
      <ul className="space-y-1">
        {items.map((url, idx) => (
          <li key={idx} className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
            <a href={url} target="_blank" rel="noreferrer" className="truncate max-w-[220px] hover:underline">{url}</a>
            <button className="text-red-600 hover:text-red-700 ml-2" onClick={() => remove(idx)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
