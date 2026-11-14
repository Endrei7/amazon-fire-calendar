import type {
  ConfidenceFilter,
  DayNightFilter,
  FiresResponse,
  Granularity,
  GridResponse,
  RegionInfo,
  SensorFilter,
  TimelineResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function getRegions(): Promise<RegionInfo[]> {
  const data = await fetchJson<{ regions: RegionInfo[] }>('/api/regions');
  return data.regions;
}

export interface QueryFilters {
  bbox?: string | null;
  daynight?: DayNightFilter;
  minConfidence?: ConfidenceFilter;
  viirsOnlyWeight?: number;
  period?: string | null;
  sensor?: SensorFilter;
  startDate?: string | null;
  endDate?: string | null;
}

export function getFires(
  region: string,
  sensor: SensorFilter,
  days = 7,
  limit = 800,
  filters?: QueryFilters,
): Promise<FiresResponse> {
  const params = new URLSearchParams({
    region,
    sensor,
    days: String(days),
    limit: String(limit),
  });
  if (filters?.bbox) params.set('bbox', filters.bbox);
  if (filters?.daynight && filters.daynight !== 'all') params.set('daynight', filters.daynight);
  if (filters?.minConfidence && filters.minConfidence !== 'all') {
    params.set('min_confidence', filters.minConfidence);
  }
  if (filters?.period) params.set('period', filters.period);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  return fetchJson<FiresResponse>(`/api/fires?${params.toString()}`);
}

export function getTimeline(
  region: string,
  granularity: Granularity,
  filters?: QueryFilters,
): Promise<TimelineResponse> {
  const params = new URLSearchParams({ region, granularity });
  if (filters?.bbox) params.set('bbox', filters.bbox);
  if (filters?.daynight && filters.daynight !== 'all') params.set('daynight', filters.daynight);
  if (filters?.minConfidence && filters.minConfidence !== 'all') {
    params.set('min_confidence', filters.minConfidence);
  }
  if (filters?.viirsOnlyWeight !== undefined) {
    params.set('viirs_only_weight', String(filters.viirsOnlyWeight));
  }
  if (filters?.sensor && filters.sensor !== 'both') params.set('sensor', filters.sensor);
  if (filters?.period) params.set('period', filters.period);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  return fetchJson<TimelineResponse>(`/api/timeline?${params.toString()}`);
}

export function getGrid(
  region: string,
  days = 7,
  cellSize = 1.25,
  filters?: QueryFilters,
): Promise<GridResponse> {
  const params = new URLSearchParams({
    region,
    days: String(days),
    cell_size: String(cellSize),
  });
  if (filters?.bbox) params.set('bbox', filters.bbox);
  if (filters?.daynight && filters.daynight !== 'all') params.set('daynight', filters.daynight);
  if (filters?.minConfidence && filters.minConfidence !== 'all') {
    params.set('min_confidence', filters.minConfidence);
  }
  if (filters?.viirsOnlyWeight !== undefined) {
    params.set('viirs_only_weight', String(filters.viirsOnlyWeight));
  }
  if (filters?.sensor && filters.sensor !== 'both') params.set('sensor', filters.sensor);
  if (filters?.period) params.set('period', filters.period);
  if (filters?.startDate) params.set('start_date', filters.startDate);
  if (filters?.endDate) params.set('end_date', filters.endDate);
  return fetchJson<GridResponse>(`/api/grid?${params.toString()}`);
}
