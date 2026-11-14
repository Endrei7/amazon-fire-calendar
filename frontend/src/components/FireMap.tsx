import { useEffect, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { I18N, type Language } from '../i18n';
import type { AlertLevel, ColorRamp, FireHotspot, Granularity, GridCell, MapViewMode } from '../types';
import { DateRangePickerPopover } from './DateRangePickerPopover';

interface FireMapProps {
  fires: FireHotspot[];
  gridCells: GridCell[];
  viewMode: MapViewMode;
  colorRamp?: ColorRamp;
  center: [number, number];
  zoom: number;
  lang: Language;
  customBbox?: [number, number, number, number] | null;
  isDrawingAoi?: boolean;
  onSelectBbox?: (bbox: [number, number, number, number]) => void;
  startDate?: string | null;
  endDate?: string | null;
  granularity?: Granularity;
  selectedPeriod?: string | null;
  onApplyDateRange?: (start: string | null, end: string | null, nextGranularity?: Granularity) => void;
  onSelectPeriod?: (period: string | null, nextGranularity?: Granularity) => void;
  onClearPeriod?: () => void;
}

const GRID_COLORS_ALERT: Record<AlertLevel, { color: string; fillOpacity: number }> = {
  critical: { color: '#ef4444', fillOpacity: 0.45 },
  elevated: { color: '#f59e0b', fillOpacity: 0.38 },
  normal: { color: '#10b981', fillOpacity: 0.28 },
};

const GRID_COLORS_VIRIDIS: Record<AlertLevel, { color: string; fillOpacity: number }> = {
  critical: { color: '#fde725', fillOpacity: 0.52 },
  elevated: { color: '#21918c', fillOpacity: 0.44 },
  normal: { color: '#440154', fillOpacity: 0.38 },
};

function MapViewportSync({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

function AoiSelectorLayer({
  enabled,
  onSelectBbox,
}: {
  enabled: boolean;
  onSelectBbox?: (bbox: [number, number, number, number]) => void;
}) {
  const [firstCorner, setFirstCorner] = useState<[number, number] | null>(null);
  const [hoverCorner, setHoverCorner] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFirstCorner(null);
      setHoverCorner(null);
    }
  }, [enabled]);

  useMapEvents({
    click(e) {
      if (!enabled || !onSelectBbox) return;
      const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (!firstCorner) {
        setFirstCorner(pt);
        setHoverCorner(pt);
      } else {
        const south = Math.min(firstCorner[0], pt[0]);
        const north = Math.max(firstCorner[0], pt[0]);
        const west = Math.min(firstCorner[1], pt[1]);
        const east = Math.max(firstCorner[1], pt[1]);
        if (east - west > 0.1 && north - south > 0.1) {
          onSelectBbox([
            Number(west.toFixed(3)),
            Number(south.toFixed(3)),
            Number(east.toFixed(3)),
            Number(north.toFixed(3)),
          ]);
        }
        setFirstCorner(null);
        setHoverCorner(null);
      }
    },
    mousemove(e) {
      if (!enabled || !firstCorner) return;
      setHoverCorner([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!enabled || !firstCorner || !hoverCorner) return null;

  const bounds: [[number, number], [number, number]] = [
    [Math.min(firstCorner[0], hoverCorner[0]), Math.min(firstCorner[1], hoverCorner[1])],
    [Math.max(firstCorner[0], hoverCorner[0]), Math.max(firstCorner[1], hoverCorner[1])],
  ];

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '6 4',
      }}
    />
  );
}

export function FireMap({
  fires,
  gridCells,
  viewMode,
  colorRamp = 'alert',
  center,
  zoom,
  lang,
  customBbox,
  isDrawingAoi = false,
  onSelectBbox,
  startDate = null,
  endDate = null,
  granularity = 'month',
  selectedPeriod = null,
  onApplyDateRange,
  onSelectPeriod,
  onClearPeriod,
}: FireMapProps) {
  const t = I18N[lang];
  const palette = colorRamp === 'viridis' ? GRID_COLORS_VIRIDIS : GRID_COLORS_ALERT;

  return (
    <div className={`map-container ${isDrawingAoi ? 'map-drawing-aoi' : ''}`}>
      {onApplyDateRange && (
        <DateRangePickerPopover
          startDate={startDate}
          endDate={endDate}
          granularity={granularity}
          selectedPeriod={selectedPeriod}
          lang={lang}
          variant="floating"
          onApplyRange={onApplyDateRange}
          onSelectPeriod={onSelectPeriod}
          onClearPeriod={onClearPeriod}
        />
      )}
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <MapViewportSync center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AoiSelectorLayer enabled={isDrawingAoi} onSelectBbox={onSelectBbox} />

        {customBbox && (
          <Rectangle
            bounds={[
              [customBbox[1], customBbox[0]],
              [customBbox[3], customBbox[2]],
            ]}
            pathOptions={{
              color: '#38bdf8',
              fillColor: '#38bdf8',
              fillOpacity: 0.07,
              weight: 2,
              dashArray: '8 5',
            }}
          />
        )}

        {viewMode === 'grid' &&
          gridCells.map((cell) => {
            const style = palette[cell.severity];
            const overlapLabel =
              cell.sensor_overlap === 'coincident'
                ? t.overlapCoincident
                : cell.sensor_overlap === 'viirs_only'
                  ? t.overlapViirsOnly
                  : t.overlapModisOnly;

            return (
              <Rectangle
                key={cell.id}
                bounds={cell.bounds}
                pathOptions={{
                  color: style.color,
                  fillColor: style.color,
                  fillOpacity: style.fillOpacity,
                  weight: 1.4,
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
                    {t.popupOverlap}: <strong>{overlapLabel}</strong>
                    <br />
                    {t.popupRawModis}: {cell.modis_raw} | {t.popupRawViirs}: {cell.viirs_raw}
                    <br />
                    {t.popupNormViirs}: {cell.viirs_normalized}
                    <br />
                    <strong>
                      {t.popupHarmIndex}: {cell.harmonized_index}
                    </strong>
                    <br />
                    {t.popupAvgFrp}: {cell.avg_frp} MW | {t.popupFootprint}:{' '}
                    {cell.avg_footprint_km2 ?? 0.5} km²
                  </div>
                </Popup>
              </Rectangle>
            );
          })}

        {viewMode === 'footprints' &&
          fires.map((fire, idx) => {
            const isModis = fire.sensor === 'MODIS';
            const scanKm = fire.scan ?? (isModis ? 1.4 : 0.38);
            const trackKm = fire.track ?? (isModis ? 1.1 : 0.38);
            const areaKm2 = fire.pixel_area_km2 ?? Number((scanKm * trackKm).toFixed(3));
            // Visual exaggeration factor (12x) so off-nadir rectangular pixel stretch is visible at regional zoom
            const halfLat = (trackKm * 12) / 222.0;
            const halfLon = (scanKm * 12) / 222.0;
            const bounds: [[number, number], [number, number]] = [
              [fire.latitude - halfLat, fire.longitude - halfLon],
              [fire.latitude + halfLat, fire.longitude + halfLon],
            ];

            return (
              <Rectangle
                key={`fp-${fire.sensor}-${fire.latitude}-${fire.longitude}-${idx}`}
                bounds={bounds}
                pathOptions={{
                  color: isModis ? '#f59e0b' : '#ef4444',
                  fillColor: isModis ? '#f59e0b' : '#ef4444',
                  fillOpacity: isModis ? 0.38 : 0.65,
                  weight: isModis ? 1.5 : 1,
                }}
              >
                <Popup>
                  <div style={{ color: '#111827', fontSize: '12px', lineHeight: 1.45 }}>
                    <strong>
                      {t.popupSensor}: {fire.sensor}
                    </strong>{' '}
                    ({fire.satellite || 'NRT'})
                    <br />
                    <strong>
                      {t.popupFootprint}: {scanKm} × {trackKm} km ({areaKm2} km²)
                    </strong>
                    <br />
                    {t.popupDate}: {fire.acq_date} {fire.acq_time.slice(0, 2)}:
                    {fire.acq_time.slice(2)} UTC
                    <br />
                    {t.popupBrightness}: {fire.brightness} K | FRP: {fire.frp} MW
                    <br />
                    {t.popupConfidence}: {fire.confidence}
                  </div>
                </Popup>
              </Rectangle>
            );
          })}

        {viewMode === 'points' &&
          fires.map((fire, idx) => {
            const isModis = fire.sensor === 'MODIS';
            const scanKm = fire.scan ?? (isModis ? 1.0 : 0.38);
            const trackKm = fire.track ?? (isModis ? 1.0 : 0.38);
            const areaKm2 = fire.pixel_area_km2 ?? Number((scanKm * trackKm).toFixed(3));
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
                    {t.popupFootprint}: {scanKm} × {trackKm} km ({areaKm2} km²)
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
