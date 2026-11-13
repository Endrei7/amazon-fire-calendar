import type { FiresResponse, Granularity, GridResponse, RegionInfo, SensorFilter, TimelineResponse } from './types';

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

export function getFires(
  region: string,
  sensor: SensorFilter,
  days = 5,
  limit = 800,
): Promise<FiresResponse> {
  const params = new URLSearchParams({
    region,
    sensor,
    days: String(days),
    limit: String(limit),
  });
  return fetchJson<FiresResponse>(`/api/fires?${params.toString()}`);
}

export function getTimeline(
  region: string,
  granularity: Granularity,
): Promise<TimelineResponse> {
  const params = new URLSearchParams({ region, granularity });
  return fetchJson<TimelineResponse>(`/api/timeline?${params.toString()}`);
}

export function getGrid(
  region: string,
  days = 5,
  cellSize = 1.25,
): Promise<GridResponse> {
  const params = new URLSearchParams({
    region,
    days: String(days),
    cell_size: String(cellSize),
  });
  return fetchJson<GridResponse>(`/api/grid?${params.toString()}`);
}
