import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { I18N, type Language } from '../i18n';
import type { Granularity } from '../types';

interface DateRangePickerPopoverProps {
  startDate: string | null;
  endDate: string | null;
  granularity: Granularity;
  selectedPeriod?: string | null;
  lang: Language;
  onApplyRange: (start: string | null, end: string | null, nextGranularity?: Granularity) => void;
  onClearPeriod?: () => void;
}

const DEFAULT_YEAR = 2026;
const DEFAULT_MONTH = 9; // October (0-indexed)
const SELECTABLE_YEARS = [2024, 2025, 2026];

function padTwoDigits(n: number): string {
  return String(n).padStart(2, '0');
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${padTwoDigits(monthIndex + 1)}-${padTwoDigits(day)}`;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function parseIsoParts(iso: string): { year: number; monthIndex: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return {
    year: Number(m[1]),
    monthIndex: Number(m[2]) - 1,
    day: Number(m[3]),
  };
}

function formatPillDateRange(
  startDate: string | null,
  endDate: string | null,
  selectedPeriod: string | null | undefined,
  lang: Language,
): string {
  const t = I18N[lang];
  if (selectedPeriod) {
    return `${t.periodFilterLabel}: ${selectedPeriod}`;
  }
  if (!startDate || !endDate) {
    return t.datePickerFullYear;
  }
  const s = parseIsoParts(startDate);
  const e = parseIsoParts(endDate);
  if (!s || !e) return `${startDate} - ${endDate}`;

  const monthNames = t.months;
  const sLabel = `${padTwoDigits(s.day)} ${monthNames[s.monthIndex] ?? ''}`;
  const eLabel = `${padTwoDigits(e.day)} ${monthNames[e.monthIndex] ?? ''}`;
  if (s.year === e.year) {
    return `${sLabel} - ${eLabel}, ${e.year}`;
  }
  return `${sLabel} ${s.year} - ${eLabel} ${e.year}`;
}

export function DateRangePickerPopover({
  startDate,
  endDate,
  granularity,
  selectedPeriod,
  lang,
  onApplyRange,
  onClearPeriod,
}: DateRangePickerPopoverProps) {
  const t = I18N[lang];
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(DEFAULT_YEAR);
  const [viewMonth, setViewMonth] = useState<number>(DEFAULT_MONTH);
  const [draftStart, setDraftStart] = useState<string | null>(startDate);
  const [draftEnd, setDraftEnd] = useState<string | null>(endDate);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [localGranularity, setLocalGranularity] = useState<Granularity>(granularity);

  useEffect(() => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    if (startDate) {
      const parsed = parseIsoParts(startDate);
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.monthIndex);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    setLocalGranularity(granularity);
  }, [granularity]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (evt: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(evt.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = daysInMonth(viewYear, viewMonth);
    const cells: Array<{ day: number; iso: string } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDays; d += 1) {
      cells.push({ day: d, iso: toIsoDate(viewYear, viewMonth, d) });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const previewRange = useMemo(() => {
    if (draftStart && draftEnd) {
      return draftStart <= draftEnd ? [draftStart, draftEnd] : [draftEnd, draftStart];
    }
    if (draftStart && hoverDate) {
      return draftStart <= hoverDate ? [draftStart, hoverDate] : [hoverDate, draftStart];
    }
    if (draftStart) {
      return [draftStart, draftStart];
    }
    return null;
  }, [draftStart, draftEnd, hoverDate]);

  const hasActiveFilter = Boolean((startDate && endDate) || selectedPeriod);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => Math.max(SELECTABLE_YEARS[0], y - 1));
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => Math.min(SELECTABLE_YEARS[SELECTABLE_YEARS.length - 1], y + 1));
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (iso: string) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(iso);
      setDraftEnd(null);
      return;
    }
    const [orderedStart, orderedEnd] = draftStart <= iso ? [draftStart, iso] : [iso, draftStart];
    setDraftStart(orderedStart);
    setDraftEnd(orderedEnd);
    setHoverDate(null);
    onApplyRange(orderedStart, orderedEnd, localGranularity);
    setOpen(false);
  };

  const handleScaleToggle = (nextScale: Granularity) => {
    setLocalGranularity(nextScale);
    if (nextScale === 'week') {
      setViewYear(DEFAULT_YEAR);
      setViewMonth(DEFAULT_MONTH);
      setDraftStart('2026-10-22');
      setDraftEnd('2026-10-28');
      onApplyRange('2026-10-22', '2026-10-28', 'week');
    } else {
      const mStart = toIsoDate(viewYear, viewMonth, 1);
      const mEnd = toIsoDate(viewYear, viewMonth, daysInMonth(viewYear, viewMonth));
      setDraftStart(mStart);
      setDraftEnd(mEnd);
      onApplyRange(mStart, mEnd, 'month');
    }
  };

  const handleSelectFullMonth = () => {
    const mStart = toIsoDate(viewYear, viewMonth, 1);
    const mEnd = toIsoDate(viewYear, viewMonth, daysInMonth(viewYear, viewMonth));
    setDraftStart(mStart);
    setDraftEnd(mEnd);
    setLocalGranularity('month');
    onApplyRange(mStart, mEnd, 'month');
    setOpen(false);
  };

  const handleApplyDraft = () => {
    if (draftStart && draftEnd) {
      const [s, e] = draftStart <= draftEnd ? [draftStart, draftEnd] : [draftEnd, draftStart];
      onApplyRange(s, e, localGranularity);
      setOpen(false);
    } else if (draftStart) {
      onApplyRange(draftStart, draftStart, localGranularity);
      setOpen(false);
    }
  };

  const handleClearAll = () => {
    setDraftStart(null);
    setDraftEnd(null);
    setHoverDate(null);
    onApplyRange(null, null, localGranularity);
    onClearPeriod?.();
    setOpen(false);
  };

  const pillLabel = formatPillDateRange(startDate, endDate, selectedPeriod, lang);

  return (
    <div
      ref={anchorRef}
      className="map-date-picker-anchor"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className={`map-date-pill ${hasActiveFilter ? 'active' : ''}`}>
        <button
          type="button"
          className="map-date-pill-trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={t.datePickerTitle}
        >
          <Calendar size={14} color="#f97316" />
          <span className="map-date-pill-text">{pillLabel}</span>
          <span className="map-date-scale-tag">
            {granularity === 'week' ? t.weekly : t.monthly}
          </span>
          <ChevronDown size={14} />
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            className="map-date-pill-clear"
            onClick={handleClearAll}
            title={t.clearRangeBtn}
            aria-label={t.clearRangeBtn}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="map-date-popover" role="dialog" aria-label={t.datePickerTitle}>
          <div className="cal-popover-top">
            <span className="cal-popover-title">{t.datePickerTitle}</span>
            <div className="toggle-group cal-scale-toggle" role="group" aria-label={t.datePickerModeLabel}>
              <button
                type="button"
                className={`toggle-btn ${localGranularity === 'month' ? 'active' : ''}`}
                onClick={() => handleScaleToggle('month')}
              >
                {t.monthly}
              </button>
              <button
                type="button"
                className={`toggle-btn ${localGranularity === 'week' ? 'active' : ''}`}
                onClick={() => handleScaleToggle('week')}
              >
                {t.weekly}
              </button>
            </div>
          </div>

          <div className="cal-presets-grid">
            <button
              type="button"
              className={`cal-preset-btn ${startDate === '2026-10-22' && endDate === '2026-10-28' ? 'active' : ''}`}
              onClick={() => {
                setLocalGranularity('week');
                onApplyRange('2026-10-22', '2026-10-28', 'week');
                setOpen(false);
              }}
            >
              {t.presetLast7d}
            </button>
            <button
              type="button"
              className={`cal-preset-btn ${startDate === '2026-09-29' && endDate === '2026-10-28' ? 'active' : ''}`}
              onClick={() => {
                setLocalGranularity('month');
                onApplyRange('2026-09-29', '2026-10-28', 'month');
                setOpen(false);
              }}
            >
              {t.presetLast30d}
            </button>
            <button
              type="button"
              className={`cal-preset-btn ${startDate === '2026-08-01' && endDate === '2026-09-30' ? 'active' : ''}`}
              onClick={() => {
                setLocalGranularity('month');
                onApplyRange('2026-08-01', '2026-09-30', 'month');
                setOpen(false);
              }}
            >
              {t.presetDryPeak}
            </button>
            <button
              type="button"
              className={`cal-preset-btn ${!startDate && !endDate ? 'active' : ''}`}
              onClick={() => {
                setLocalGranularity('month');
                onApplyRange(null, null, 'month');
                setOpen(false);
              }}
            >
              {t.presetFullYear}
            </button>
          </div>

          <div className="cal-nav-row">
            <button
              type="button"
              className="cal-icon-btn"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="cal-select-pair">
              <select
                className="control-select control-select-sm"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                aria-label="Month"
              >
                {t.months.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                className="control-select control-select-sm"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                aria-label="Year"
              >
                {SELECTABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="cal-icon-btn"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={15} />
            </button>

            <button
              type="button"
              className="cal-full-month-btn"
              onClick={handleSelectFullMonth}
            >
              {t.selectFullMonthBtn}
            </button>
          </div>

          <div className="cal-weekdays-row">
            {t.weekdaysShort.map((wd) => (
              <span key={wd} className="cal-weekday-label">
                {wd}
              </span>
            ))}
          </div>

          <div className="cal-grid" onMouseLeave={() => setHoverDate(null)}>
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <span key={`empty-${idx}`} className="cal-day-empty" />;
              }
              const inRange = Boolean(
                previewRange && cell.iso >= previewRange[0] && cell.iso <= previewRange[1],
              );
              const isEdge = Boolean(
                previewRange && (cell.iso === previewRange[0] || cell.iso === previewRange[1]),
              );
              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={`cal-day ${inRange ? 'in-range' : ''} ${isEdge ? 'range-edge' : ''}`}
                  onMouseEnter={() => {
                    if (draftStart && !draftEnd) setHoverDate(cell.iso);
                  }}
                  onClick={() => handleDayClick(cell.iso)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="cal-popover-footer">
            <span className="cal-hint-text">
              {draftStart && !draftEnd
                ? t.calendarHintEnd
                : previewRange
                  ? `${previewRange[0]} → ${previewRange[1]}`
                  : t.calendarHintStart}
            </span>
            <div className="cal-footer-actions">
              <button type="button" className="cal-clear-btn" onClick={handleClearAll}>
                {t.clearRangeBtn}
              </button>
              <button
                type="button"
                className="cal-apply-btn"
                onClick={handleApplyDraft}
                disabled={!draftStart}
              >
                {t.applyRangeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
