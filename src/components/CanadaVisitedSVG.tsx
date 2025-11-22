import React, { useEffect, useRef, useState } from 'react'
import PhotoList from './PhotoList'
import { usePanZoom } from './usePanZoom'

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>

const WIDTH = 1000
const HEIGHT = 560

const DEFAULT_BOUNDS = { minLon: -141.0, maxLon: -52.0, minLat: 41.0, maxLat: 84.0 }

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

const MINIMAL_CA: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Canada' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-141, 42], [-141, 84], [-52, 84], [-52, 42], [-141, 42]]],
      },
    },
  ],
}

const NAME_TO_CODE: Record<string, string> = {
  'alberta': 'AB',
  'british columbia': 'BC',
  'manitoba': 'MB',
  'new brunswick': 'NB',
  'newfoundland and labrador': 'NL',
  'nova scotia': 'NS',
  'ontario': 'ON',
  'prince edward island': 'PE',
  'quebec': 'QC',
  'saskatchewan': 'SK',
  'northwest territories': 'NT',
  'nunavut': 'NU',
  'yukon': 'YT',
}

const CanadaVisitedSVG: React.FC = () => {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null)
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS)
  const [fallbackUsed, setFallbackUsed] = useState(false)
  const [visited, setVisited] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:visitedCA')
      const parsed: unknown = raw ? JSON.parse(raw) : []
      const arr = Array.isArray(parsed) ? parsed : []
      return new Set(arr.map((c: unknown) => String(c).toUpperCase()))
    } catch {
      return new Set()
    }
  })
  const saveVisited = (s: Set<string>): void => {
    try {
      localStorage.setItem('lifesync:travel:visitedCA', JSON.stringify(Array.from(s)))
    } catch {
      // Ignore storage errors
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const res = await fetch('/canada-provinces.geo.json', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as GeoJSON.FeatureCollection
        if (!cancelled) { setData(json); setFallbackUsed(false) }
        try {
          let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
          for (const f of (json.features as GeoFeature[])) {
            const each = (coords: unknown): void => {
              if (Array.isArray(coords) && typeof coords[0] === 'number') {
                const [lon, lat] = coords as [number, number]
                minLon = Math.min(minLon, lon)
                maxLon = Math.max(maxLon, lon)
                minLat = Math.min(minLat, lat)
                maxLat = Math.max(maxLat, lat)
                return
              }
              if (Array.isArray(coords)) {
                for (const c of coords) each(c)
              }
            }
            const g = f.geometry
            if (g && 'coordinates' in g) {
              each(g.coordinates)
            }
          }
          if (isFinite(minLon) && isFinite(maxLon) && isFinite(minLat) && isFinite(maxLat)) {
            setBounds({ minLon, maxLon, minLat, maxLat })
          }
        } catch {
          // Ignore bounds calculation errors
        }
      } catch {
        if (!cancelled) { setData(MINIMAL_CA); setFallbackUsed(true) }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  // Pan/zoom
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { scale, pan, panning, handleWheel, onMouseDown, onMouseMove, endPan, zoomBy, resetView } = usePanZoom({ width: WIDTH, height: HEIGHT })

  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null)
  const [meta, setMeta] = useState<Record<string, { notes?: string; photos?: string[] }>>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:caMeta')
      const parsed: unknown = raw ? JSON.parse(raw) : {}
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, { notes?: string; photos?: string[] }>
      }
      return {}
    } catch {
      return {}
    }
  })
  const saveMeta = (next: typeof meta): void => {
    setMeta(next)
    try {
      localStorage.setItem('lifesync:travel:caMeta', JSON.stringify(next))
    } catch {
      // Ignore storage errors
    }
  }
  const getPointer = (evt: React.MouseEvent): { x: number; y: number } => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return { x: evt.clientX - r.left, y: evt.clientY - r.top }
  }

  const codeOf = (props: Record<string, unknown>): string => {
    const rawCode = props.postal ?? props.code ?? props.abbrev ?? props.PROV_CODE ?? props.STUSPS ?? ''
    const c = (typeof rawCode === 'string' || typeof rawCode === 'number') ? String(rawCode).toUpperCase() : ''
    if (c && c.length <= 3) return c
    const rawName = props.name ?? props.NAME ?? props.province ?? props.prov_name ?? ''
    const name = (typeof rawName === 'string' || typeof rawName === 'number') ? String(rawName).toLowerCase() : ''
    return NAME_TO_CODE[name] ?? name.toUpperCase().slice(0, 2)
  }
  const nameOf = (props: Record<string, unknown>): string => {
    const rawName = props.name ?? props.NAME ?? props.province ?? props.prov_name ?? 'Unknown'
    return (typeof rawName === 'string' || typeof rawName === 'number') ? String(rawName) : 'Unknown'
  }

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
            const props = f.properties ?? {}
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
                  setVisited(next); saveVisited(next)
                }}
                onDoubleClick={() => setSelected({ code, name })}
                onMouseEnter={(e) => { const pt = getPointer(e); setHover({ name, x: pt.x + 12, y: pt.y + 12 }) }}
                onMouseMove={(e) => { const pt = getPointer(e); setHover((h) => (h ? { ...h, x: pt.x + 12, y: pt.y + 12 } : { name, x: pt.x + 12, y: pt.y + 12 })) }}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute z-[1000] top-3 right-3 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow flex overflow-hidden">
        <button className="px-3 py-2 text-sm hover:bg-gray-50 border-r" onClick={() => zoomBy(1.2)}>+</button>
        <button className="px-3 py-2 text-sm hover:bg-gray-50 border-r" onClick={() => zoomBy(1/1.2)}>−</button>
        <button className="px-3 py-2 text-xs hover:bg-gray-50" onClick={resetView}>Reset</button>
      </div>

      {/* Hover tooltip */}
      {hover && (
        <div className="pointer-events-none absolute bg-white/95 border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 shadow" style={{ left: hover.x, top: hover.y }}>
          {hover.name} <span className="text-[10px] text-gray-500 ml-2">(double‑click to edit)</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute z-[1000] bottom-3 right-3 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow px-3 py-2 text-xs text-gray-700">
        <div className="flex items-center space-x-2 mb-1"><span className="inline-block w-3 h-3 rounded-sm opacity-40" style={{ background: '#9CA3AF' }} /><span>Filtered out</span></div>
        <div className="flex items-center space-x-2 mb-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#60A5FA' }} /><span>Not visited</span></div>
        <div className="flex items-center space-x-2"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#22C55E' }} /><span>Visited</span></div>
      </div>

      {/* Export / Import / Stats */}
      <div className="absolute z-[1000] bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 shadow flex items-center overflow-hidden">
        <button className="px-3 py-2 text-xs hover:bg-gray-50 border-r" onClick={() => {
          try {
            const arr = Array.from(visited)
            const blob = new Blob([JSON.stringify({ visited: arr, meta }, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'visited-canada.json'
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
          } catch {
            // Ignore export errors
          }
        }}>Export JSON</button>
        <button className="px-3 py-2 text-xs hover:bg-gray-50 border-r" onClick={() => {
          void (async () => {
            try {
              const svg = svgRef.current
              if (!svg) return
              const clone = svg.cloneNode(true) as SVGSVGElement
              clone.setAttribute('width', String(WIDTH))
              clone.setAttribute('height', String(HEIGHT))
              const ser = new XMLSerializer()
              const str = ser.serializeToString(clone)
              const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const img = new Image()
              await new Promise<void>((res, rej) => {
                img.onload = () => res()
                img.onerror = rej
                img.src = url
              })
              const canvas = document.createElement('canvas')
              canvas.width = WIDTH
              canvas.height = HEIGHT
              const ctx = canvas.getContext('2d')
              if (!ctx) return
              ctx.fillStyle = '#F8FAFC'
              ctx.fillRect(0, 0, WIDTH, HEIGHT)
              ctx.drawImage(img, 0, 0)
              URL.revokeObjectURL(url)
              const pngUrl = canvas.toDataURL('image/png')
              const a = document.createElement('a')
              a.href = pngUrl
              a.download = 'canada-map.png'
              document.body.appendChild(a)
              a.click()
              a.remove()
            } catch {
              // Ignore export errors
            }
          })()
        }}>Export PNG</button>
        <label className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 border-r">
          Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={(e) => {
            void (async () => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                const json = JSON.parse(text) as { visited?: unknown; meta?: unknown }
                if (Array.isArray(json.visited)) {
                  const s = new Set((json.visited as unknown[]).map((c) => String(c).toUpperCase()))
                  setVisited(s)
                  saveVisited(s)
                }
                if (json.meta && typeof json.meta === 'object') {
                  saveMeta(json.meta as Record<string, { notes?: string; photos?: string[] }>)
                }
              } catch {
                // Ignore import errors
              }
              e.currentTarget.value = ''
            })()
          }} />
        </label>
        <div className="px-3 py-2 text-[11px] text-gray-700 dark:text-gray-300">
          {(() => {
            const total = features.length
            const vcount = visited.size
            const pct = total ? Math.round((vcount / total) * 100) : 0
            return `${vcount}/${total} (${pct}%) visited`
          })()}
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <div className="absolute inset-y-0 right-0 z-[1100] w-full max-w-sm bg-white border-l border-gray-200 shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Canada Province/Territory</div>
              <div className="text-lg font-semibold text-gray-900">{selected.name}</div>
              <div className="text-xs text-gray-500">Code: {selected.code}</div>
            </div>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="p-4 space-y-4 overflow-auto">
            <div className="flex items-center justify-between"><span className="text-sm text-gray-700">Visited</span><button className={`px-3 py-1.5 text-xs rounded ${visited.has(selected.code) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`} onClick={() => { const next = new Set(visited); if (visited.has(selected.code)) next.delete(selected.code); else next.add(selected.code); setVisited(next); saveVisited(next) }}>{visited.has(selected.code) ? 'Yes' : 'No'}</button></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea className="w-full h-28 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={meta[selected.code]?.notes ?? ''} onChange={(e) => { const next = { ...meta, [selected.code]: { ...meta[selected.code], notes: e.target.value } }; saveMeta(next) }} placeholder="Memories, places, dates…" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Photo URLs</label><PhotoList items={meta[selected.code]?.photos ?? []} onChange={(list) => { const next = { ...meta, [selected.code]: { ...meta[selected.code], photos: list } }; saveMeta(next) }} /></div>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end"><button className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50" onClick={() => setSelected(null)}>Close</button></div>
        </div>
      )}

      {fallbackUsed && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 text-xs text-amber-700 border border-amber-300 rounded px-3 py-1.5 shadow">Using minimal fallback. Run <code>npm run data:download:canada-geojson</code> then reload.</div>
      )}
    </div>
  )
}

export default CanadaVisitedSVG
