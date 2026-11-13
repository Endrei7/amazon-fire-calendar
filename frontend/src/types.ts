export type SensorFilter = 'both' | 'MODIS' | 'VIIRS';
export type Granularity = 'month' | 'week';
export type AlertLevel = 'normal' | 'elevated' | 'critical';

export interface RegionInfo {
  id: string;
  name: string;
  bbox: [number, number, number, number];
  center: [number, number];
  zoom: number;
}

export interface FireHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  frp: number;
  confidence: string;
  acq_date: string;
  acq_time: string;
  satellite: string;
  sensor: 'MODIS' | 'VIIRS';
  daynight: string;
}

export interface FiresResponse {
  region: string;
  sensor: string;
  data_source: string;
  total_count: number;
  returned_count: number;
  fires: FireHotspot[];
}

export interface TimelinePoint {
  period: string;
  modis_raw: number;
  viirs_raw: number;
  viirs_normalized: number;
  harmonized_total: number;
  historical_avg: number;
  deviation_pct: number;
  alert_level: AlertLevel;
}

export interface TimelineSummary {
  ytd_harmonized: number;
  ytd_historical: number;
  ytd_deviation_pct: number;
  peak_period: string;
  early_warning_status: AlertLevel;
  recommendation: string;
}

export interface TimelineResponse {
  region: string;
  region_name: string;
  granularity: Granularity;
  calibration_factor: number;
  calibration_source: string;
  data_source: string;
  summary: TimelineSummary;
  series: TimelinePoint[];
}

export interface GridCell {
  id: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
  modis_raw: number;
  viirs_raw: number;
  viirs_normalized: number;
  harmonized_index: number;
  avg_frp: number;
  severity: AlertLevel;
}

export interface GridResponse {
  region: string;
  region_name: string;
  cell_size: number;
  calibration_factor: number;
  total_cells: number;
  data_source: string;
  cells: GridCell[];
}
