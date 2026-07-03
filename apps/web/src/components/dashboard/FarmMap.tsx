'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface FarmMapPlot {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  geometry?: Record<string, unknown> | null;
}

interface FarmMapProps {
  plots: FarmMapPlot[];
  height?: string;
}

const CROP_COLORS: Record<string, string> = {
  SOJA: '#16a34a',
  MILHO: '#eab308',
  CAFE: '#7c2d12',
  ALGODAO: '#0ea5e9',
  CANA: '#84cc16',
  ARROZ: '#22d3ee',
  TRIGO: '#d97706',
  FEIJAO: '#a16207',
  PECUARIA_CORTE: '#dc2626',
  PECUARIA_LEITE: '#f472b6',
};

function colorFor(crop: string): string {
  return CROP_COLORS[crop] ?? '#10b981';
}

// quadrado aproximado a partir de coordenada + área (fallback quando não há contorno)
function approxRing(lat: number, lon: number, areaHa: number): [number, number][] {
  const side = Math.sqrt(Math.max(areaHa, 0.01) * 10000);
  const half = side / 2;
  const dLat = half / 111320;
  const dLon = half / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  return [
    [lat - dLat, lon - dLon],
    [lat - dLat, lon + dLon],
    [lat + dLat, lon + dLon],
    [lat + dLat, lon - dLon],
  ];
}

export default function FarmMap({ plots, height = 'h-96' }: FarmMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([-15.7942, -47.8825], 4);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const group = L.featureGroup().addTo(map);

    for (const plot of plots) {
      const color = colorFor(plot.crop);
      const popup = `<strong>${plot.name}</strong><br/>${plot.crop} · ${plot.areaHa} ha<br/><span style="color:#6b7280">${plot.status}</span>`;

      if (plot.geometry && (plot.geometry as { coordinates?: unknown }).coordinates) {
        try {
          const layer = L.geoJSON(
            { type: 'Feature', geometry: plot.geometry, properties: {} } as unknown as GeoJSON.Feature,
            { style: { color, weight: 2, fillOpacity: 0.35 } },
          );
          layer.bindPopup(popup);
          layer.addTo(group);
          continue;
        } catch {
          /* geometria inválida — cai no fallback */
        }
      }

      if (plot.latitude != null && plot.longitude != null) {
        const ring = approxRing(plot.latitude, plot.longitude, plot.areaHa);
        L.polygon(ring, { color, weight: 2, dashArray: '4', fillOpacity: 0.2 })
          .bindPopup(`${popup}<br/><em style="color:#9ca3af">área aproximada</em>`)
          .addTo(group);
      }
    }

    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }

    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [plots]);

  return <div ref={containerRef} className={`${height} w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700`} />;
}
