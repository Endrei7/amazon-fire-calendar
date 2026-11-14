import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, Rectangle, TileLayer, useMap } from 'react-leaflet';
import { I18N, type Language } from '../i18n';
import type { AlertLevel, FireHotspot, GridCell } from '../types';

interface FireMapProps {
  fires: FireHotspot[];
  gridCells: GridCell[];
  viewMode: 'points' | 'grid';
  center: [number, number];
  zoom: number;
  lang: Language;
}

const GRID_COLORS: Record<AlertLevel, { color: string; fillOpacity: number }> = {
  critical: { color: '#ef4444', fillOpacity: 0.45 },
  elevated: { color: '#f59e0b', fillOpacity: 0.38 },
  normal: { color: '#10b981', fillOpacity: 0.28 },
};

function MapViewportSync({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

export function FireMap({ fires, gridCells, viewMode, center, zoom, lang }: FireMapProps) {
  const t = I18N[lang];

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <MapViewportSync center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {viewMode === 'grid'
          ? gridCells.map((cell) => {
              const style = GRID_COLORS[cell.severity];
              return (
                <Rectangle
                  key={cell.id}
                  bounds={cell.bounds}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.color,
                    fillOpacity: style.fillOpacity,
                    weight: 1.2,
                  }}
                >
                  <Popup>
                    <div style={{ color: '#111827', fontSize: '12px', lineHeight: 1.5 }}>
                      <strong>
                        {t.popupQuadrant} {cell.id} ({t.alertLabels[cell.severity]})
                      </strong>
                      <br />
                      {t.popupCenter}: {cell.center[0]}°, {cell.center[1]}°
                      <br />
                      {t.popupRawModis}: {cell.modis_raw} | {t.popupRawViirs}: {cell.viirs_raw}
                      <br />
                      {t.popupNormViirs}: {cell.viirs_normalized}
                      <br />
                      <strong>
                        {t.popupHarmIndex}: {cell.harmonized_index}
                      </strong>
                      <br />
                      {t.popupAvgFrp}: {cell.avg_frp} MW
                    </div>
                  </Popup>
                </Rectangle>
              );
            })
          : fires.map((fire, idx) => {
              const isModis = fire.sensor === 'MODIS';
              return (
                <CircleMarker
                  key={`${fire.sensor}-${fire.latitude}-${fire.longitude}-${idx}`}
                  center={[fire.latitude, fire.longitude]}
                  radius={isModis ? 6 : 4}
                  pathOptions={{
                    color: isModis ? '#f59e0b' : '#ef4444',
                    fillColor: isModis ? '#f59e0b' : '#ef4444',
                    fillOpacity: isModis ? 0.55 : 0.72,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div style={{ color: '#111827', fontSize: '12px', lineHeight: 1.45 }}>
                      <strong>
                        {t.popupSensor}: {fire.sensor}
                      </strong>{' '}
                      ({fire.satellite || 'NRT'})
                      <br />
                      {t.popupDate}: {fire.acq_date} {fire.acq_time.slice(0, 2)}:
                      {fire.acq_time.slice(2)} UTC
                      <br />
                      {t.popupBrightness}: {fire.brightness} K | FRP: {fire.frp} MW
                      <br />
                      {t.popupConfidence}: {fire.confidence}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
      </MapContainer>
    </div>
  );
}
