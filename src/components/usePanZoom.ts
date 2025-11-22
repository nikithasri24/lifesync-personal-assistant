import { useState } from 'react'
import type React from 'react'

interface UsePanZoomProps {
  width: number
  height: number
}

interface UsePanZoomReturn {
  scale: number
  pan: { x: number; y: number }
  panning: boolean
  handleWheel: (evt: React.WheelEvent<SVGSVGElement>) => void
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void
  endPan: () => void
  zoomBy: (m: number) => void
  resetView: () => void
}

export function usePanZoom({ width, height }: UsePanZoomProps): UsePanZoomReturn {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [lastPt, setLastPt] = useState<{ x: number; y: number } | null>(null)
  const [vel, setVel] = useState({ x: 0, y: 0 })
  const [lastTs, setLastTs] = useState<number | null>(null)
  const [inertiaId, setInertiaId] = useState<number | null>(null)

  const clampScale = (v: number): number => Math.max(0.5, Math.min(8, v))
  const clampPan = (p: { x: number; y: number }, s: number): { x: number; y: number } => {
    const minX = Math.min(0, width - width * s), maxX = Math.max(0, width - width * s)
    const minY = Math.min(0, height - height * s), maxY = Math.max(0, height - height * s)
    return { x: Math.max(minX, Math.min(maxX, p.x)), y: Math.max(minY, Math.min(maxY, p.y)) }
  }
  const toSvgPoint = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>): { x: number; y: number } => {
    const svg = evt.currentTarget
    const r = svg.getBoundingClientRect()
    return { x: evt.clientX - r.left, y: evt.clientY - r.top }
  }

  const handleWheel = (evt: React.WheelEvent<SVGSVGElement>): void => {
    evt.preventDefault()
    const f = evt.deltaY < 0 ? 1.1 : 0.9
    const nativeEvt = evt.nativeEvent as MouseEvent & { offsetX?: number; offsetY?: number }
    const p0 = { x: nativeEvt.offsetX ?? 0, y: nativeEvt.offsetY ?? 0 }
    const ns = clampScale(scale * f)
    const k = ns / scale
    const np = { x: p0.x - (p0.x - pan.x) * k, y: p0.y - (p0.y - pan.y) * k }
    setScale(ns)
    setPan(clampPan(np, ns))
  }

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>): void => {
    setPanning(true)
    setLastPt(toSvgPoint(e))
    setVel({ x: 0, y: 0 })
    setLastTs(performance.now())
    if (inertiaId) {
      cancelAnimationFrame(inertiaId)
      setInertiaId(null)
    }
  }

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>): void => {
    if (!panning || !lastPt) return
    const pt = toSvgPoint(e)
    const dx = pt.x - lastPt.x, dy = pt.y - lastPt.y
    const now = performance.now()
    const dt = lastTs ? Math.max(16, now - lastTs) : 16
    setLastTs(now)
    setVel({ x: dx / dt, y: dy / dt })
    setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy }, scale))
    setLastPt(pt)
  }

  const endPan = (): void => {
    setPanning(false)
    setLastPt(null)
    setLastTs(null)
    const friction = 0.95, minSpeed = 0.02
    const step = (): void => {
      setPan((p) => clampPan({ x: p.x + vel.x * 16, y: p.y + vel.y * 16 }, scale))
      setVel((v) => ({ x: v.x * friction, y: v.y * friction }))
      if (Math.hypot(vel.x, vel.y) > minSpeed) {
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

  const zoomBy = (m: number): void => {
    const p0 = { x: width / 2, y: height / 2 }
    const ns = clampScale(scale * m)
    const k = ns / scale
    const np = { x: p0.x - (p0.x - pan.x) * k, y: p0.y - (p0.y - pan.y) * k }
    setScale(ns)
    setPan(clampPan(np, ns))
  }

  const resetView = (): void => {
    setScale(1)
    setPan({ x: 0, y: 0 })
    if (inertiaId) {
      cancelAnimationFrame(inertiaId)
      setInertiaId(null)
    }
  }

  return {
    scale,
    pan,
    panning,
    handleWheel,
    onMouseDown,
    onMouseMove,
    endPan,
    zoomBy,
    resetView,
  }
}
