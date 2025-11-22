export const WIDTH = 1000
export const HEIGHT = 560

// Default bounds that include Alaska/Hawaii/CONUS reasonably
export const DEFAULT_BOUNDS = { minLon: -179.9, maxLon: -66.0, minLat: 18.0, maxLat: 72.0 }

export const MINIMAL_US: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'United States' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-125, 24], [-125, 50], [-66, 50], [-66, 24], [-125, 24]]],
      },
    },
  ],
}

export const REGION_BY_CODE: Record<string, 'northeast' | 'midwest' | 'south' | 'west'> = {
  // Northeast
  CT: 'northeast', ME: 'northeast', MA: 'northeast', NH: 'northeast', RI: 'northeast', VT: 'northeast',
  NJ: 'northeast', NY: 'northeast', PA: 'northeast', DC: 'south', DE: 'south',
  // Midwest
  IL: 'midwest', IN: 'midwest', MI: 'midwest', OH: 'midwest', WI: 'midwest',
  IA: 'midwest', KS: 'midwest', MN: 'midwest', MO: 'midwest', NE: 'midwest', ND: 'midwest', SD: 'midwest',
  // South
  FL: 'south', GA: 'south', MD: 'south', NC: 'south', SC: 'south', VA: 'south', WV: 'south',
  AL: 'south', KY: 'south', MS: 'south', TN: 'south', AR: 'south', LA: 'south', OK: 'south', TX: 'south',
  // West
  AZ: 'west', CO: 'west', ID: 'west', MT: 'west', NV: 'west', NM: 'west', UT: 'west', WY: 'west',
  AK: 'west', CA: 'west', HI: 'west', OR: 'west', WA: 'west'
}

export const project = (lon: number, lat: number, b = DEFAULT_BOUNDS): [number, number] => {
  const x = ((lon - b.minLon) / (b.maxLon - b.minLon)) * WIDTH
  const y = ((b.maxLat - lat) / (b.maxLat - b.minLat)) * HEIGHT
  return [x, y]
}

export const buildPath = (geom: GeoJSON.Geometry, b?: typeof DEFAULT_BOUNDS): string => {
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

export const getCode = (props: Record<string, unknown>): string => {
  const value = (props.postal ?? props.STUSPS ?? props.code ?? props.abbrev ?? '') as string
  return String(value).toUpperCase()
}

export const getName = (props: Record<string, unknown>): string => {
  const value = (props.name ?? props.NAME ?? props.state ?? '') as string
  return String(value).trim() || 'Unknown'
}

export const clampScale = (v: number): number => Math.max(0.5, Math.min(8, v))

export const clampPan = (p: { x: number; y: number }, s: number): { x: number; y: number } => {
  const minX = Math.min(0, WIDTH - WIDTH * s)
  const maxX = Math.max(0, WIDTH - WIDTH * s)
  const minY = Math.min(0, HEIGHT - HEIGHT * s)
  const maxY = Math.max(0, HEIGHT - HEIGHT * s)
  return {
    x: Math.max(minX, Math.min(maxX, p.x)),
    y: Math.max(minY, Math.min(maxY, p.y)),
  }
}
