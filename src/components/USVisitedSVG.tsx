import React, { useEffect, useRef, useState } from 'react'
import {
  WIDTH,
  HEIGHT,
  DEFAULT_BOUNDS,
  MINIMAL_US,
  REGION_BY_CODE,
  buildPath,
  getCode,
  getName,
  clampScale,
  clampPan,
} from './USVisitedSVG.constants'
import PhotoList from './PhotoList'

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>
const USVisitedSVG: React.FC = () => {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null)
  const [regionFilter, setRegionFilter] = useState<'all' | 'northeast' | 'midwest' | 'south' | 'west'>('all')
  const [bounds, setBounds] = useState(DEFAULT_BOUNDS)
  const [visitedCodes, setVisitedCodes] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:visitedUSStates')
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      return new Set(arr.map((c) => c.toUpperCase()))
    } catch { return new Set() }
  })
  const persistVisited = (next: Set<string>): void => {
    try { localStorage.setItem('lifesync:travel:visitedUSStates', JSON.stringify(Array.from(next))) } catch { /* Silently fail */ }
  }
  const [fallbackUsed, setFallbackUsed] = useState(false)
  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const res = await fetch('/us-states.geo.json', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as GeoJSON.FeatureCollection
        if (!cancelled) setData(json)
        if (!cancelled) setFallbackUsed(false)
        // attempt to compute bounds from data
        try {
          let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
          for (const f of (json.features as GeoFeature[])) {
            const g = f.geometry
            const each = (coords: unknown): void => {
              if (Array.isArray(coords) && typeof coords[0] === 'number') {
                const [lon, lat] = coords as [number, number]
                minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon)
                minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
                return
              }
              if (Array.isArray(coords)) {
                for (const c of coords) each(c)
              }
            }
            if (g && 'coordinates' in g) each(g.coordinates)
          }
          if (isFinite(minLon) && isFinite(maxLon) && isFinite(minLat) && isFinite(maxLat)) {
            setBounds({ minLon, maxLon, minLat, maxLat })
          }
        } catch { /* Silently fail */ }
      } catch {
        if (!cancelled) { setData(MINIMAL_US); setFallbackUsed(true) }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])
  const features = (data?.features as GeoFeature[] | undefined) ?? []
  const handleToggle = (code: string): void => {
    if (!code) return
    const next = new Set(visitedCodes)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    setVisitedCodes(next)
    persistVisited(next)
  }
  // Pan/zoom similar to world SVG
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [lastPt, setLastPt] = useState<{ x: number; y: number } | null>(null)
  const [vel, setVel] = useState({ x: 0, y: 0 })
  const [lastTs, setLastTs] = useState<number | null>(null)
  const [inertiaId, setInertiaId] = useState<number | null>(null)
  const toSvgPoint = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>): { x: number; y: number } => {
    const svg = evt.currentTarget
    const rect = svg.getBoundingClientRect()
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
  }
  const handleWheel = (evt: React.WheelEvent<SVGSVGElement>): void => {
    evt.preventDefault()
    const factor = evt.deltaY < 0 ? 1.1 : 0.9
    const nativeEvent = evt.nativeEvent as MouseEvent & { offsetX?: number; offsetY?: number }
    const svgPt = { x: nativeEvent.offsetX ?? 0, y: nativeEvent.offsetY ?? 0 }
    const newScale = clampScale(scale * factor)
    const k = newScale / scale
    const newPanUnclamped = { x: svgPt.x - (svgPt.x - pan.x) * k, y: svgPt.y - (svgPt.y - pan.y) * k }
    setScale(newScale)
    setPan(clampPan(newPanUnclamped, newScale))
  }
  const onMouseDown = (evt: React.MouseEvent<SVGSVGElement>): void => {
    setPanning(true)
    setLastPt(toSvgPoint(evt))
    setVel({ x: 0, y: 0 })
    setLastTs(performance.now())
    if (inertiaId) { cancelAnimationFrame(inertiaId); setInertiaId(null) }
  }
  const onMouseMove = (evt: React.MouseEvent<SVGSVGElement>): void => {
    if (!panning || !lastPt) return
    const pt = toSvgPoint(evt)
    const dx = pt.x - lastPt.x
    const dy = pt.y - lastPt.y
    const now = performance.now()
    const dt = lastTs ? Math.max(16, now - lastTs) : 16
    setLastTs(now)
    setVel({ x: dx / dt, y: dy / dt })
    setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy }, scale))
    setLastPt(pt)
  }
  const endPan = (): void => {
    setPanning(false); setLastPt(null); setLastTs(null)
    const friction = 0.95, minSpeed = 0.02
    const step = (): void => {
      setPan((p) => clampPan({ x: p.x + vel.x * 16, y: p.y + vel.y * 16 }, scale))
      setVel((v) => ({ x: v.x * friction, y: v.y * friction }))
      if (Math.hypot(vel.x, vel.y) > minSpeed) {
        const id = requestAnimationFrame(step); setInertiaId(id)
      } else { if (inertiaId) cancelAnimationFrame(inertiaId); setInertiaId(null) }
    }
    if (Math.hypot(vel.x, vel.y) > minSpeed) { const id = requestAnimationFrame(step); setInertiaId(id) }
  }
  const zoomBy = (mult: number): void => {
    const svgPt = { x: WIDTH / 2, y: HEIGHT / 2 }
    const newScale = clampScale(scale * mult)
    const k = newScale / scale
    const newPanUnclamped = { x: svgPt.x - (svgPt.x - pan.x) * k, y: svgPt.y - (svgPt.y - pan.y) * k }
    setScale(newScale)
    setPan(clampPan(newPanUnclamped, newScale))
  }
  const resetView = (): void => { setScale(1); setPan({ x: 0, y: 0 }); if (inertiaId) { cancelAnimationFrame(inertiaId); setInertiaId(null) } }
  // Hover + side panel
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null)
  const [stateMeta, setStateMeta] = useState<Record<string, { notes?: string; photos?: string[] }>>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:usStateMeta')
      return raw ? JSON.parse(raw) as Record<string, { notes?: string; photos?: string[] }> : {}
    } catch { return {} }
  })
  const saveStateMeta = (next: typeof stateMeta): void => {
    setStateMeta(next)
    try { localStorage.setItem('lifesync:travel:usStateMeta', JSON.stringify(next)) } catch { /* Silently fail */ }
  }
  const getPointer = (evt: React.MouseEvent): { x: number; y: number } => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
  }
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
          {(features).map((f, idx) => {
            const props = f.properties || {}
            const code = getCode(props)
            const name = getName(props)
            const d = f.geometry ? buildPath(f.geometry, bounds) : ''
            if (!d) return null
            const visited = code ? visitedCodes.has(code) : false
            const region = REGION_BY_CODE[code] || 'west'
            const filtered = regionFilter !== 'all' && region !== regionFilter
            return (
              <path
                key={idx}
                d={d}
                fill={visited ? '#22C55E' : '#60A5FA'}
                fillOpacity={visited ? (filtered ? 0.35 : 0.65) : (filtered ? 0.06 : 0.28)}
                stroke="#1F2937"
                strokeWidth={visited ? 0.8 : 0.5}
                vectorEffect="non-scaling-stroke"
                onClick={() => handleToggle(code)}
                onDoubleClick={() => setSelected({ code, name })}
                onMouseEnter={(e) => { const pt = getPointer(e); setHover({ name, x: pt.x + 12, y: pt.y + 12 }) }}
                onMouseMove={(e) => { const pt = getPointer(e); setHover((h) => (h ? { ...h, x: pt.x + 12, y: pt.y + 12 } : { name, x: pt.x + 12, y: pt.y + 12 })) }}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </g>
      </svg>

      {/* Region filter */}
      <div className="absolute z-[1000] top-3 left-3 bg-white/90 backdrop-blur rounded-md border border-gray-200 shadow px-3 py-2 text-sm flex items-center space-x-2">
        <label className="text-gray-600">Region:</label>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value as 'all' | 'northeast' | 'midwest' | 'south' | 'west')}
          className="text-gray-800 border border-gray-300 rounded px-2 py-1 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="northeast">Northeast</option>
          <option value="midwest">Midwest</option>
          <option value="south">South</option>
          <option value="west">West</option>
        </select>
      </div>

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
        <div className="flex items-center space-x-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-sm opacity-40" style={{ background: '#9CA3AF' }} />
          <span>Filtered out</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#60A5FA' }} />
          <span>Not visited</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#22C55E' }} />
          <span>Visited</span>
        </div>
      </div>

      {/* Export / Import / Stats */}
      <div className="absolute z-[1000] bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700 shadow flex items-center overflow-hidden">
        <button
          className="px-3 py-2 text-xs hover:bg-gray-50 border-r"
          onClick={() => {
            try {
              const arr = Array.from(visitedCodes)
              const meta = stateMeta
              const blob = new Blob([JSON.stringify({ visited: arr, meta }, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'visited-us-states.json'
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            } catch { /* Silently fail */ }
          }}
        >Export JSON</button>
        <button
          className="px-3 py-2 text-xs hover:bg-gray-50 border-r"
          onClick={() => {
            void (async (): Promise<void> => {
              try {
                const svg = svgRef.current
                if (!svg) return
                const clone = svg.cloneNode(true) as SVGSVGElement
                clone.setAttribute('width', String(WIDTH))
                clone.setAttribute('height', String(HEIGHT))
                const serializer = new XMLSerializer()
                const svgStr = serializer.serializeToString(clone)
                const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
                const url = URL.createObjectURL(svgBlob)
                const img = new Image()
                await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url })
                const canvas = document.createElement('canvas')
                canvas.width = WIDTH
                canvas.height = HEIGHT
                const ctx = canvas.getContext('2d')
                if (!ctx) return
                ctx.fillStyle = '#F8FAFC'; ctx.fillRect(0, 0, WIDTH, HEIGHT)
                ctx.drawImage(img, 0, 0)
                URL.revokeObjectURL(url)
                const pngUrl = canvas.toDataURL('image/png')
                const a = document.createElement('a')
                a.href = pngUrl
                a.download = 'us-map.png'
                document.body.appendChild(a)
                a.click()
                a.remove()
              } catch { /* Silently fail */ }
            })()
          }}
        >Export PNG</button>
        <label className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 border-r">
          Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={(e) => {
            void (async (): Promise<void> => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                const json = JSON.parse(text) as { visited?: unknown; meta?: unknown }
                if (Array.isArray(json.visited)) {
                  const s = new Set((json.visited as string[]).map((c) => c.toUpperCase()))
                  setVisitedCodes(s)
                  persistVisited(s)
                }
                if (json.meta && typeof json.meta === 'object') {
                  saveStateMeta(json.meta as Record<string, { notes?: string; photos?: string[] }>)
                }
              } catch { /* Silently fail */ }
              e.currentTarget.value = ''
            })()
          }} />
        </label>
        <div className="px-3 py-2 text-[11px] text-gray-700 dark:text-gray-300">
          {(() => {
            const total = features.length
            const vcount = visitedCodes.size
            const pct = total ? Math.round((vcount / total) * 100) : 0
            return `${vcount}/${total} (${pct}%) visited`
          })()}
        </div>
      </div>

      {fallbackUsed && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 text-xs text-amber-700 border border-amber-300 rounded px-3 py-1.5 shadow">
          Using minimal fallback. Run <code>npm run data:download:us-geojson</code> then reload.
        </div>
      )}

      {/* Side panel */}
      {selected && (
        <div className="absolute inset-y-0 right-0 z-[1100] w-full max-w-sm bg-white border-l border-gray-200 shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">US State</div>
              <div className="text-lg font-semibold text-gray-900">{selected.name}</div>
              <div className="text-xs text-gray-500">Code: {selected.code}</div>
            </div>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="p-4 space-y-4 overflow-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Visited</span>
              <button className={`px-3 py-1.5 text-xs rounded ${visitedCodes.has(selected.code) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`} onClick={() => handleToggle(selected.code)}>
                {visitedCodes.has(selected.code) ? 'Yes' : 'No'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full h-28 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={stateMeta[selected.code]?.notes ?? ''}
                onChange={(e) => {
                  const next = { ...stateMeta, [selected.code]: { ...stateMeta[selected.code], notes: e.target.value } }
                  saveStateMeta(next)
                }}
                placeholder="Memories, places, dates…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo URLs</label>
              <PhotoList items={stateMeta[selected.code]?.photos ?? []} onChange={(list) => { const next = { ...stateMeta, [selected.code]: { ...stateMeta[selected.code], photos: list } }; saveStateMeta(next) }} />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end">
            <button className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default USVisitedSVG
