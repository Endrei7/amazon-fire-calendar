// Relative date presets computed from the user's current date (no hardcoded calendars).

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toIso(d);
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function currentMonthIndex(): number {
  return new Date().getMonth();
}

export interface DateRange {
  start: string;
  end: string;
}

export function last7Days(): DateRange {
  return { start: daysAgoIso(6), end: todayIso() };
}

export function last30Days(): DateRange {
  return { start: daysAgoIso(29), end: todayIso() };
}

export function yearToDate(): DateRange {
  return { start: `${currentYear()}-01-01`, end: todayIso() };
}

export function dryPeak(): DateRange {
  const y = currentYear();
  return { start: `${y}-08-01`, end: `${y}-09-30` };
}

export function isSameRange(start: string | null, end: string | null, r: DateRange): boolean {
  return start === r.start && end === r.end;
}
