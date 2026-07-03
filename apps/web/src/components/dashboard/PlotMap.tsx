'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

export interface PlotMapValue {
  geometry: Record<string, unknown> | null;
  latitude: number | null;
  longitude: number | null;
  areaHa: number | null;
}

interface PlotMapProps {
  initialGeometry?: Record<string, unknown> | null;
  center?: [number, number];
  onChange: (value: PlotMapValue) => void;
}

// centroide simples (média dos vértices) e área geodésica (m² -> ha)
function computeFromLayer(layer: L.Polygon): PlotMapValue {
  const gj = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>;
  const latlngs = layer.getLatLngs()[0] as L.LatLng[];
  const lat = latlngs.reduce((s, p) => s + p.lat, 0) / latlngs.length;
  const lng = latlngs.reduce((s, p) => s + p.lng, 0) / latlngs.length;
  // L.GeometryUtil vem do leaflet-draw
  const geomUtil = (L as unknown as { GeometryUtil?: { geodesicArea: (l: L.LatLng[]) => number } }).GeometryUtil;
  const areaM2 = geomUtil ? geomUtil.geodesicArea(latlngs) : 0;
  return {
    geometry: gj.geometry as unknown as Record<string, unknown>,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
    areaHa: areaM2 > 0 ? Number((areaM2 / 10000).toFixed(2)) : null,
  };
}

export default function PlotMap({ initialGeometry, center, onChange }: PlotMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(center ?? [-15.7942, -47.8825], center ? 14 : 4);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // carrega geometria existente
    if (initialGeometry && (initialGeometry as { coordinates?: unknown }).coordinates) {
      try {
        const gjLayer = L.geoJSON({ type: 'Feature', geometry: initialGeometry, properties: {} } as unknown as GeoJSON.Feature);
        gjLayer.eachLayer((l) => {
          const poly = l as L.Polygon;
          drawnItems.addLayer(poly);
          map.fitBounds(poly.getBounds(), { padding: [20, 20] });
        });
      } catch {
        /* geometria inválida — ignora */
      }
    }

    const drawControl = new (L.Control as unknown as { Draw: new (o: unknown) => L.Control }).Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        polyline: false,
        rectangle: {},
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup: drawnItems },
    });
    map.addControl(drawControl);

    const emit = () => {
      const layers = drawnItems.getLayers();
      if (layers.length === 0) {
        onChangeRef.current({ geometry: null, latitude: null, longitude: null, areaHa: null });
        return;
      }
      onChangeRef.current(computeFromLayer(layers[layers.length - 1] as L.Polygon));
    };

    map.on((L as unknown as { Draw: { Event: { CREATED: string } } }).Draw.Event.CREATED, (e: unknown) => {
      const layer = (e as { layer: L.Layer }).layer;
      drawnItems.clearLayers(); // apenas 1 talhão por vez
      drawnItems.addLayer(layer);
      emit();
    });
    map.on('draw:edited', emit);
    map.on('draw:deleted', emit);

    // corrige render quando o mapa abre dentro de modal
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-72 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" />;
}
