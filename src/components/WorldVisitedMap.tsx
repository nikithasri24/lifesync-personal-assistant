import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import countriesData from '../data/countries.json'

type Feature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string; ADMIN?: string; ISO_A2?: string; iso_a2?: string; iso_a3?: string }>

const WORLD_GEOJSON_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'

const FitWorldBounds: React.FC<{ whenReady?: boolean }> = () => {
  const map = useMap()
  useEffect(() => {
    try {
      map.setView([20, 0], 2)
      setTimeout(() => {
        try { map.invalidateSize() } catch {}
      }, 200)
    } catch {}
  }, [map])
  return null
}

const FitToData: React.FC<{ data: GeoJSON.FeatureCollection | null }> = ({ data }) => {
  const map = useMap()
  useEffect(() => {
    if (!data) return
    try {
      // Compute bounds and fit
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const L = require('leaflet')
      const layer = L.geoJSON(data as any)
      const b = layer.getBounds()
      if (b && b.isValid()) {
        map.fitBounds(b.pad(0.05))
      } else {
        map.setView([20, 0], 2)
      }
      setTimeout(() => {
        try { map.invalidateSize() } catch {}
      }, 200)
    } catch {}
  }, [data, map])
  return null
}

const WorldVisitedMap: React.FC = () => {

  const [regionFilter, setRegionFilter] = useState<'all' | 'africa' | 'asia' | 'europe' | 'north america' | 'south america' | 'oceania' | 'antarctica'>('all')
  const [baseLayer, setBaseLayer] = useState<'satellite' | 'streets' | 'topo'>(() => {
    try {
      const raw = localStorage.getItem('lifesync:travel:baseLayer')
      return (raw === 'satellite' || raw === 'topo') ? (raw as any) : 'streets'
    } catch { return 'streets' }
  })
  const [tileError, setTileError] = useState(false)

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

  const visitedByCode = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const code of visitedCodes) map.set(code, true)
    return map
  }, [visitedCodes])

  const continentByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of (countriesData as any[])) {
      if (!c?.code) continue
      const region = (c.continent || '').toString()
      map.set(String(c.code).toUpperCase(), region)
    }
    return map
  }, [])

  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const MINIMAL_WORLD: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'World' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-179.9, -60], [-179.9, 80], [179.9, 80], [179.9, -60], [-179.9, -60],
              ],
            ],
          },
        },
      ],
    }

    const load = async () => {
      const tryFetch = async (url: string) => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as GeoJSON.FeatureCollection
      }
      try {
        setError(null)
        let json: GeoJSON.FeatureCollection | null = null
        try {
          // Prefer local fallback for reliability/offline
          json = await tryFetch('/world-countries.geo.json')
        } catch {
          // Fallback to remote GitHub dataset
          try {
            json = await tryFetch(WORLD_GEOJSON_URL)
          } catch {
            json = MINIMAL_WORLD
          }
        }
        if (!cancelled && json) setData(json)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load world map')
          setData(MINIMAL_WORLD)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const onEachFeature = (feature: Feature, layer: any) => {
    const props = feature?.properties || {}
    const code = String((props.iso_a2 || props.ISO_A2 || '')).toUpperCase()
    const name = props.name || props.ADMIN || code
    const isVisited = code ? visitedByCode.get(code) : false
    const continent = (code ? continentByCode.get(code) : '') || ''
    const filteredOut = regionFilter !== 'all' && continent.toLowerCase() !== regionFilter

    layer.bindTooltip(`${name}${isVisited ? ' — visited' : ''}`, { sticky: true })

    layer.on({
      mouseover: () => {
        try { layer.setStyle({ weight: 1.2, color: '#4B5563' }) } catch {}
      },
      mouseout: () => {
        try { layer.setStyle({ weight: 0.6, color: '#9CA3AF' }) } catch {}
      },
      click: () => {
        if (filteredOut) return
        if (!code) return
        const next = new Set(visitedCodes)
        if (isVisited) next.delete(code)
        else next.add(code)
        setVisitedCodes(next)
        persistVisited(next)
      },
    })
  }

  const style = (feature: any) => {
    const props = feature?.properties || {}
    const code = String((props.iso_a2 || props.ISO_A2 || '')).toUpperCase()
    const isVisited = code ? visitedByCode.get(code) : false
    const continent = (code ? continentByCode.get(code) : '') || ''
    const filteredOut = regionFilter !== 'all' && continent.toLowerCase() !== regionFilter
    const showPlain = true // always draw light fill so map is visible even without tiles
    return {
      color: filteredOut ? '#CBD5E1' : '#111827',
      weight: filteredOut ? 0.5 : 1.0,
      // If basemap failed, lightly fill non-visited so shapes are visible
      fillOpacity: isVisited
        ? (filteredOut ? 0.35 : 0.6)
        : (filteredOut ? 0.08 : 0.35),
      fillColor: isVisited ? '#10B981' : '#93C5FD',
    }
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-gray-200" style={{ height: 560 }}>
      {/* Controls */}
      <div className="absolute z-[1000] top-3 left-3 space-y-2">
        <div className="bg-white/90 backdrop-blur rounded-md border border-gray-200 shadow px-3 py-2 text-sm flex items-center space-x-2">
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
        <div className="bg-white/90 backdrop-blur rounded-md border border-gray-200 shadow px-3 py-2 text-sm flex items-center space-x-2">
          <label className="text-gray-600">Basemap:</label>
          <select
            value={baseLayer}
            onChange={(e) => {
              const v = e.target.value as typeof baseLayer
              setBaseLayer(v)
              try { localStorage.setItem('lifesync:travel:baseLayer', v) } catch {}
            }}
            className="text-gray-800 border border-gray-300 rounded px-2 py-1 focus:outline-none"
          >
            <option value="satellite">Satellite</option>
            <option value="streets">Streets</option>
            <option value="topo">Terrain</option>
          </select>
        </div>
      </div>
      {/* Legend */}
      <div className="absolute z-[1000] bottom-3 right-3 bg-white/90 backdrop-blur rounded-md border border-gray-200 shadow px-3 py-2 text-xs text-gray-700">
        <div className="flex items-center space-x-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#10B981' }} />
          <span>Visited</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#E5E7EB' }} />
          <span>Not visited</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-sm opacity-30" style={{ background: '#E5E7EB' }} />
          <span>Filtered out</span>
        </div>
      </div>
      {!data && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
          Loading world map…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-600 text-sm">
          Failed to load world map
        </div>
      )}
      <MapContainer center={[20, 0]} zoom={2} minZoom={1} maxZoom={8} scrollWheelZoom className="w-full h-full">
        {baseLayer === 'satellite' && (
          <TileLayer
            key="satellite"
            attribution='Imagery &copy; Esri, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            eventHandlers={{
              tileerror: () => {
                setTileError(true)
                setBaseLayer('streets')
              },
            }}
          />
        )}
        {baseLayer === 'streets' && (
          <TileLayer
            key="streets"
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setTileError(true),
              load: () => setTileError(false),
            }}
          />
        )}
        {baseLayer === 'topo' && (
          <TileLayer
            key="topo"
            attribution='Tiles &copy; Esri — Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            eventHandlers={{
              tileerror: () => {
                setTileError(true)
                setBaseLayer('streets')
              },
            }}
          />
        )}
        <FitWorldBounds />
        <FitToData data={data} />
        {data && (
          <GeoJSON key={regionFilter} data={data as any} onEachFeature={onEachFeature as any} style={style as any} />
        )}
      </MapContainer>
      {tileError && (
        <div className="absolute top-3 right-3 bg-white/90 text-xs text-amber-700 border border-amber-300 rounded px-2 py-1 shadow">
          Basemap unavailable. Showing plain country map.
        </div>
      )}
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">Loading…</div>
      )}
      {data && error && (
        <div className="absolute bottom-3 left-3 bg-white/90 text-xs text-red-600 border border-red-300 rounded px-2 py-1 shadow">
          Map data fallback active. Add <code>public/world-countries.geo.json</code> for full detail.
        </div>
      )}
    </div>
  )
}

export default WorldVisitedMap
