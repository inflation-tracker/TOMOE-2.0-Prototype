'use client'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { provinsiNasional } from '@/lib/mock-data'

type Province = typeof provinsiNasional[number]

interface IndonesiaMapProps {
  data: Province[]
  onSelect?: (prov: Province) => void
  selected?: string | null
}

function riskToColor(risk: number): string {
  if (risk >= 80) return '#e0584f'
  if (risk >= 65) return '#f97316'
  if (risk >= 50) return '#f3c24b'
  return '#2bb37a'
}

function riskToRadius(risk: number): number {
  return 8 + (risk / 100) * 14
}

export function IndonesiaMap({ data, onSelect }: IndonesiaMapProps) {
  const mapRef    = useRef<HTMLDivElement>(null)
  // Typed as the Leaflet Map (type-only import → erased, no SSR import) so
  // .remove() is callable without an `as any` cast.
  const mapObjRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default marker icon path issue with Next.js. Reflect.deleteProperty
      // removes Leaflet's internal `_getIconUrl` without an `as any` cast.
      Reflect.deleteProperty(L.Icon.Default.prototype, '_getIconUrl')
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [-2.5, 118.0],
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      })

      // Tile layer (light, clean)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 12,
      }).addTo(map)

      // Attribution small
      L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map)

      // Province markers
      data.forEach(prov => {
        const color  = riskToColor(prov.risk)
        const radius = riskToRadius(prov.risk)

        const circle = L.circleMarker([prov.lat, prov.lng], {
          radius,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.82,
        })

        circle.bindTooltip(`
          <div style="font-family: Plus Jakarta Sans, sans-serif; font-size: 12px; min-width: 160px;">
            <div style="font-weight: 700; color: #111827; margin-bottom: 4px;">${prov.name}</div>
            <div style="display:flex; justify-content:space-between; gap:16px;">
              <span style="color:#6b7280">YoY</span>
              <strong style="color:${color}">${prov.yoy.toFixed(2)}%</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:16px;">
              <span style="color:#6b7280">MtM</span>
              <strong style="color:${color}">+${prov.mtm.toFixed(2)}%</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:16px;">
              <span style="color:#6b7280">Risk</span>
              <strong style="color:${color}">${prov.risk}/100</strong>
            </div>
          </div>
        `, {
          permanent: false,
          direction: 'top',
          className: 'tomoe-tooltip',
          offset: [0, -radius],
        })

        circle.on('click', () => onSelect?.(prov))

        circle.addTo(map)
      })

      mapObjRef.current = map
    })

    return () => {
      if (mapObjRef.current) {
        mapObjRef.current.remove()
        mapObjRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <style>{`
        .tomoe-tooltip { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
        .tomoe-tooltip::before { display: none; }
        .leaflet-control-zoom { border: 1px solid #e5e7eb !important; border-radius: 8px !important; overflow: hidden; }
        .leaflet-control-zoom a { background: white !important; color: #374151 !important; border-bottom: 1px solid #f3f4f6 !important; }
        .leaflet-control-zoom a:hover { background: #f9fafb !important; }
      `}</style>
      <div ref={mapRef} className="h-full w-full rounded-xl" />
    </>
  )
}
