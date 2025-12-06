import React, { useEffect, useMemo, useRef, useState } from 'react'

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, any>>

const WIDTH = 1000
const HEIGHT = 560

// Very simple equirectangular projection
const project = (lon: number, lat: number) => {
  const x = ((lon + 180) / 360) * WIDTH
  const y = ((90 - lat) / 180) * HEIGHT
  return [x, y]
}

const buildPath = (geom: GeoJSON.Geometry): string => {
  const parts: string[] = []
  if (geom.type === 'Polygon') {
    const coords = geom.coordinates as number[][][]
    for (const ring of coords) {
      let first = true
      for (const [lon, lat] of ring) {
        const [x, y] = project(lon, lat)
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
          const [x, y] = project(lon, lat)
          parts.push(first ? `M ${x} ${y}` : `L ${x} ${y}`)
          first = false
        }
        parts.push('Z')
      }
    }
  }
  return parts.join(' ')
}

const MINIMAL_WORLD: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'World' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-179.9, -60], [-179.9, 80], [179.9, 80], [179.9, -60], [-179.9, -60]]],
      },
    },
  ],
}

const WorldVisitedSVG: React.FC = () => {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null)
  const [regionFilter, setRegionFilter] = useState<'all' | 'africa' | 'asia' | 'europe' | 'north america' | 'south america' | 'oceania' | 'antarctica'>('all')
  const [visitedCodes, setVisitedCodes] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:visitedCountries')
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      return new Set(arr.map((c) => c.toUpperCase()))
    } catch { return new Set() }
  })

  const persistVisited = (next: Set<string>) => {
    try { localStorage.setItem('lifesync:travel:visitedCountries', JSON.stringify(Array.from(next))) } catch {}
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/world-countries.geo.json', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as GeoJSON.FeatureCollection
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setData(MINIMAL_WORLD)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const continentByCode = useMemo(() => {
    const map = new Map<string, string>()
    // Try to get continent info from the features if present; else leave blank
    try {
      for (const f of (data?.features as GeoFeature[] | undefined) || []) {
        const props = f.properties || {}
        const code = String((props.iso_a2 || props.ISO_A2 || props.cca2 || '')).toUpperCase()
        const region = (props.region || props.continent || '').toString()
        if (code) map.set(code, region)
      }
    } catch {}
    return map
  }, [data])

  const features = (data?.features as GeoFeature[] | undefined) || []

  const getCode = (props: Record<string, any>): string =>
    String((props.iso_a2 || props.ISO_A2 || props.cca2 || '')).toUpperCase()

  const getName = (props: Record<string, any>): string =>
    String(props.name || props.ADMIN || props.admin || props.country || props.sovereignt || props.formal_en || '').trim() || 'Unknown'

  const handleToggle = (code: string) => {
    if (!code) return
    const next = new Set(visitedCodes)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    setVisitedCodes(next)
    persistVisited(next)
  }

  // Hover tooltip
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null)
  const [countryMeta, setCountryMeta] = useState<Record<string, { notes?: string; photos?: string[] }>>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:countryMeta')
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })
  const saveCountryMeta = (next: typeof countryMeta) => {
    setCountryMeta(next)
    try { localStorage.setItem('lifesync:travel:countryMeta', JSON.stringify(next)) } catch {}
  }
  const getPointer = (evt: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
  }

  // Pan/zoom state
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [lastPt, setLastPt] = useState<{ x: number; y: number } | null>(null)
  const [vel, setVel] = useState({ x: 0, y: 0 })
  const [lastTs, setLastTs] = useState<number | null>(null)
  const [inertiaId, setInertiaId] = useState<number | null>(null)

  const clampScale = (v: number) => Math.max(0.5, Math.min(6, v))

  const clampPan = (p: { x: number; y: number }, s: number) => {
    const minX = Math.min(0, WIDTH - WIDTH * s)
    const maxX = Math.max(0, WIDTH - WIDTH * s)
    const minY = Math.min(0, HEIGHT - HEIGHT * s)
    const maxY = Math.max(0, HEIGHT - HEIGHT * s)
    return {
      x: Math.max(minX, Math.min(maxX, p.x)),
      y: Math.max(minY, Math.min(maxY, p.y)),
    }
  }

  const toSvgPoint = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svg = evt.currentTarget
    const rect = svg.getBoundingClientRect()
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
  }

  const handleWheel = (evt: React.WheelEvent<SVGSVGElement>) => {
    evt.preventDefault()
    const delta = -evt.deltaY
    const factor = delta > 0 ? 1.1 : 0.9
    const svgPt = { x: (evt.nativeEvent as any).offsetX ?? 0, y: (evt.nativeEvent as any).offsetY ?? 0 }
    const newScale = clampScale(scale * factor)
    const k = newScale / scale
    const newPanUnclamped = {
      x: svgPt.x - (svgPt.x - pan.x) * k,
      y: svgPt.y - (svgPt.y - pan.y) * k,
    }
    setScale(newScale)
    setPan(clampPan(newPanUnclamped, newScale))
  }

  const onMouseDown = (evt: React.MouseEvent<SVGSVGElement>) => {
    setPanning(true)
    setLastPt(toSvgPoint(evt))
    setVel({ x: 0, y: 0 })
    setLastTs(performance.now())
    if (inertiaId) {
      cancelAnimationFrame(inertiaId)
      setInertiaId(null)
    }
  }
  const onMouseMove = (evt: React.MouseEvent<SVGSVGElement>) => {
    if (!panning || !lastPt) return
    const pt = toSvgPoint(evt)
    const dx = pt.x - lastPt.x
    const dy = pt.y - lastPt.y
    const now = performance.now()
    const dt = lastTs ? Math.max(16, now - lastTs) : 16
    setLastTs(now)
    // instantaneous velocity in px/ms
    setVel({ x: dx / dt, y: dy / dt })
    setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy }, scale))
    setLastPt(pt)
  }
  const endPan = () => {
    setPanning(false)
    setLastPt(null)
    setLastTs(null)
    // start inertia
    const friction = 0.95
    const minSpeed = 0.02
    const step = () => {
      setPan((p) => {
        const next = clampPan({ x: p.x + vel.x * 16, y: p.y + vel.y * 16 }, scale)
        return next
      })
      setVel((v) => ({ x: v.x * friction, y: v.y * friction }))
      const speed = Math.hypot(vel.x, vel.y)
      if (speed > minSpeed) {
        const id = requestAnimationFrame(step)
        setInertiaId(id)
      } else {
        if (inertiaId) cancelAnimationFrame(inertiaId)
        setInertiaId(null)
      }
    }
    if (Math.hypot(vel.x, vel.y) > minSpeed) {
      const id = requestAnimationFrame(step)
      setInertiaId(id)
    }
  }

  const zoomBy = (mult: number) => {
    const svgPt = { x: WIDTH / 2, y: HEIGHT / 2 }
    const newScale = clampScale(scale * mult)
    const k = newScale / scale
    const newPanUnclamped = {
      x: svgPt.x - (svgPt.x - pan.x) * k,
      y: svgPt.y - (svgPt.y - pan.y) * k,
    }
    setScale(newScale)
    setPan(clampPan(newPanUnclamped, newScale))
  }

  const resetView = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
    if (inertiaId) {
      cancelAnimationFrame(inertiaId)
      setInertiaId(null)
    }
  }

  // Export visited as JSON
  const exportJSON = () => {
    try {
      const arr = Array.from(visitedCodes)
      const blob = new Blob([JSON.stringify({ visited: arr }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'visited-countries.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {}
  }

  // Export map as PNG
  const exportPNG = async () => {
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
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
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
      a.download = 'travel-map.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {}
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: HEIGHT }}>
      {/* Controls */}
      <div className="absolute z-[1000] top-3 left-3 space-y-2">
        <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow px-3 py-2 text-sm flex items-center space-x-2">
          <label className="text-gray-600">Region:</label>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as any)}
            className="text-gray-800 border border-gray-300 rounded px-2 py-1 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="africa">Africa</option>
            <option value="asia">Asia</option>
            <option value="europe">Europe</option>
            <option value="north america">North America</option>
            <option value="south america">South America</option>
            <option value="oceania">Oceania</option>
            <option value="antarctica">Antarctica</option>
          </select>
        </div>
      </div>

      {/* Legend (sorted A-Z) */}
      <div className="absolute z-[1000] bottom-3 right-3 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow px-3 py-2 text-xs text-gray-700">
        <div className="text-[11px] text-gray-500 mb-1">Legend</div>
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

      <svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        ref={svgRef}
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
          const props = f.properties || {}
          const code = getCode(props)
          const name = getName(props)
          const region = (continentByCode.get(code) || '').toLowerCase()
          const filtered = regionFilter !== 'all' && region !== regionFilter
          const visited = code ? visitedCodes.has(code) : false
          const d = f.geometry ? buildPath(f.geometry) : ''
          if (!d) return null
          return (
            <path
              key={idx}
              d={d}
              fill={visited ? '#10B981' : '#93C5FD'}
              fillOpacity={visited ? (filtered ? 0.35 : 0.6) : (filtered ? 0.08 : 0.3)}
              stroke="#111827"
              strokeWidth={visited ? 0.8 : 0.5}
              vectorEffect="non-scaling-stroke"
              fillRule="evenodd"
              onClick={() => handleToggle(code)}
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

      {/* Zoom controls */}
      <div className="absolute z-[1000] top-3 right-3 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow flex overflow-hidden">
        <button className="px-3 py-2 text-sm hover:bg-gray-50 border-r" onClick={() => zoomBy(1.2)}>+</button>
        <button className="px-3 py-2 text-sm hover:bg-gray-50 border-r" onClick={() => zoomBy(1/1.2)}>−</button>
        <button className="px-3 py-2 text-xs hover:bg-gray-50" onClick={resetView}>Reset</button>
      </div>

      {/* Export / Import / Stats */}
      <div className="absolute z-[1000] bottom-3 left-3 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow flex items-center overflow-hidden">
        <button className="px-3 py-2 text-xs hover:bg-gray-50 border-r" onClick={exportJSON}>Export JSON</button>
        <button className="px-3 py-2 text-xs hover:bg-gray-50 border-r" onClick={exportPNG}>Export PNG</button>
        <label className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 border-r">
          Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
              const text = await file.text()
              const json = JSON.parse(text)
              if (Array.isArray(json.visited)) {
                const s = new Set((json.visited as string[]).map((c) => c.toUpperCase()))
                setVisitedCodes(s)
                persistVisited(s)
              }
              if (json.meta && typeof json.meta === 'object') {
                saveCountryMeta(json.meta)
              }
            } catch {}
            e.currentTarget.value = ''
          }} />
        </label>
        <div className="px-3 py-2 text-[11px] text-gray-700">
          {(() => {
            const total = features.length
            const vcount = visitedCodes.size
            const pct = total ? Math.round((vcount / total) * 100) : 0
            return `${vcount}/${total} (${pct}%) visited`
          })()}
        </div>
      </div>

      {/* Hover tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute bg-white/95 border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 shadow"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.name}
          <span className="text-[10px] text-gray-500 ml-2">(double‑click to edit)</span>
        </div>
      )}

      {/* Side panel for country details */}
      {selected && (
        <div className="absolute inset-y-0 right-0 z-[1100] w-full max-w-sm bg-white border-l border-gray-200 shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Country</div>
              <div className="text-lg font-semibold text-gray-900">{selected.name}</div>
              <div className="text-xs text-gray-500">Code: {selected.code}</div>
            </div>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="p-4 space-y-4 overflow-auto">
            {/* Visited toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Visited</span>
              <button
                className={`px-3 py-1.5 text-xs rounded ${visitedCodes.has(selected.code) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => handleToggle(selected.code)}
              >
                {visitedCodes.has(selected.code) ? 'Yes' : 'No'}
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full h-28 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={countryMeta[selected.code]?.notes || ''}
                onChange={(e) => {
                  const next = { ...countryMeta, [selected.code]: { ...countryMeta[selected.code], notes: e.target.value } }
                  saveCountryMeta(next)
                }}
                placeholder="Add trip highlights, dates, places, etc."
              />
            </div>

            {/* Photos (URLs) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo URLs</label>
              <PhotoList
                items={countryMeta[selected.code]?.photos || []}
                onChange={(list) => {
                  const next = { ...countryMeta, [selected.code]: { ...countryMeta[selected.code], photos: list } }
                  saveCountryMeta(next)
                }}
              />
            </div>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end space-x-2">
            <button className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorldVisitedSVG

// Small controlled list editor for photo URLs
function PhotoList({ items, onChange }: { items: string[]; onChange: (next: string[]) => void }) {
  const [value, setValue] = useState('')
  const add = () => {
    const v = value.trim()
    if (!v) return
    onChange([...(items || []), v])
    setValue('')
  }
  const remove = (idx: number) => {
    const next = [...items]
    next.splice(idx, 1)
    onChange(next)
  }
  return (
    <div>
      <div className="flex items-center space-x-2 mb-2">
        <input
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700" onClick={add}>Add</button>
      </div>
      <ul className="space-y-1">
        {(items || []).map((url, idx) => (
          <li key={idx} className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
            <a href={url} target="_blank" rel="noreferrer" className="truncate max-w-[220px] hover:underline">{url}</a>
            <button className="text-red-600 hover:text-red-700 ml-2" onClick={() => remove(idx)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
