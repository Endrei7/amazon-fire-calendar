import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  Flame,
  Moon,
  Scan,
  ShieldAlert,
} from 'lucide-react';
import { formatRecommendation, I18N, type Language } from '../i18n';
import type {
  AlertLevel,
  ColorRamp,
  HarmonizationDiagnostics,
  MatrixMetric,
  TimelinePoint,
  TimelineSummary,
} from '../types';

interface CalendarMatrixProps {
  series: TimelinePoint[];
  summary?: TimelineSummary;
  diagnostics?: HarmonizationDiagnostics;
  regionName: string;
  lang: Language;
  colorRamp?: ColorRamp;
  onChangeColorRamp?: (ramp: ColorRamp) => void;
}

interface PeriodInfo {
  label: string;
  sublabel: string;
  quarterIdx: number;
}

function parsePeriodInfo(period: string, months: readonly string[], weekPrefix: string): PeriodInfo {
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(period);
  if (monthMatch) {
    const [, year, month] = monthMatch;
    const idx = Math.max(0, Math.min(11, parseInt(month, 10) - 1));
    return {
      label: `${months[idx] ?? month}/${year.slice(2)}`,
      sublabel: '',
      quarterIdx: Math.min(3, Math.floor(idx / 3)),
    };
  }

  const weekMatch = /^(\d{4})-W(\d{2})$/.exec(period);
  if (weekMatch) {
    const [, year, weekStr] = weekMatch;
    const weekNum = parseInt(weekStr, 10);
    const monthIdx = Math.min(11, Math.max(0, Math.floor((weekNum - 1) / 4.345)));
    return {
      label: `${weekPrefix} ${String(weekNum).padStart(2, '0')}`,
      sublabel: `${months[monthIdx]}/${year.slice(2)}`,
      quarterIdx: Math.min(3, Math.floor(monthIdx / 3)),
    };
  }

  return { label: period, sublabel: '', quarterIdx: 0 };
}

function formatMetric(value: number): string {
  if (Math.abs(value - Math.round(value)) < 0.005) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

export function CalendarMatrix({
  series,
  summary,
  diagnostics,
  regionName,
  lang,
  colorRamp = 'alert',
  onChangeColorRamp,
}: CalendarMatrixProps) {
  const t = I18N[lang];
  const [statusFilter, setStatusFilter] = useState<'all' | AlertLevel>('all');
  const [metric, setMetric] = useState<MatrixMetric>('harmonized');

  const isWeekly = useMemo(() => series.some((item) => item.period.includes('-W')), [series]);

  const counts = useMemo(() => {
    const acc = { all: series.length, critical: 0, elevated: 0, normal: 0 };
    for (const item of series) {
      acc[item.alert_level] += 1;
    }
    return acc;
  }, [series]);

  const filteredSeries = useMemo(
    () => (statusFilter === 'all' ? series : series.filter((item) => item.alert_level === statusFilter)),
    [series, statusFilter],
  );

  const quarters = useMemo(() => {
    const groups: TimelinePoint[][] = [[], [], [], []];
    for (const item of filteredSeries) {
      const { quarterIdx } = parsePeriodInfo(item.period, t.months, t.weekPrefix);
      groups[quarterIdx].push(item);
    }
    return groups
      .map((items, idx) => ({ idx, title: t.quarters[idx], items }))
      .filter((group) => group.items.length > 0);
  }, [filteredSeries, t.months, t.weekPrefix, t.quarters]);

  const [expandedQuarters, setExpandedQuarters] = useState<number[]>(() => [
    quarters.length > 0 ? quarters[quarters.length - 1].idx : 3,
  ]);

  useEffect(() => {
    if (quarters.length === 0) return;
    setExpandedQuarters((prev) => {
      if (prev.some((idx) => quarters.some((q) => q.idx === idx))) {
        return prev;
      }
      return [quarters[quarters.length - 1].idx];
    });
  }, [quarters]);

  const allQuartersExpanded =
    quarters.length > 0 && quarters.every((q) => expandedQuarters.includes(q.idx));

  const toggleQuarter = (qIdx: number) => {
    setExpandedQuarters((prev) =>
      prev.includes(qIdx) ? prev.filter((id) => id !== qIdx) : [...prev, qIdx],
    );
  };

  const toggleAllQuarters = () => {
    if (allQuartersExpanded) {
      setExpandedQuarters([]);
    } else {
      setExpandedQuarters(quarters.map((q) => q.idx));
    }
  };

  const peakInfo = summary
    ? parsePeriodInfo(summary.peak_period, t.months, t.weekPrefix)
    : null;
  const peakText = peakInfo
    ? peakInfo.sublabel
      ? `${peakInfo.label} · ${peakInfo.sublabel}`
      : peakInfo.label
    : '—';

  const renderCard = (item: TimelinePoint) => {
    const info = parsePeriodInfo(item.period, t.months, t.weekPrefix);
    const fillPct = Math.min(
      100,
      item.historical_avg > 0 ? Math.round((item.harmonized_total / item.historical_avg) * 50) : 50,
    );

    const zscore = item.anomaly_zscore ?? Number(((item.deviation_pct || 0) / 28).toFixed(2));
    const frpVal = item.harmonized_frp ?? 0;
    const cardClass =
      colorRamp === 'viridis'
        ? `month-card month-viridis-${item.alert_level}`
        : `month-card month-${item.alert_level}`;
    const barClass =
      colorRamp === 'viridis'
        ? `month-bar-fill bar-viridis-${item.alert_level}`
        : `month-bar-fill bar-${item.alert_level}`;

    return (
      <div key={item.period} className={cardClass}>
        <div className="month-card-top">
          <div className="month-title-group">
            <span className="month-name">{info.label}</span>
            {info.sublabel && <span className="month-sub">{info.sublabel}</span>}
          </div>
          <span className={`badge badge-${item.alert_level}`}>
            {t.alertLabels[item.alert_level]}
          </span>
        </div>

        <div className="month-values">
          {metric === 'harmonized' && (
            <>
              <div>
                <span className="month-val-label">{t.harmLabel}</span>
                <strong className="month-val-num">{formatMetric(item.harmonized_total)}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="month-val-label">{t.modisAvgLabel}</span>
                <span className="month-val-base">{formatMetric(item.historical_avg)}</span>
              </div>
            </>
          )}

          {metric === 'frp' && (
            <>
              <div>
                <span className="month-val-label">{t.frpLabel}</span>
                <strong className="month-val-num">{frpVal.toFixed(1)} MW</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="month-val-label">MODIS FRP</span>
                <span className="month-val-base">{(item.modis_frp ?? 0).toFixed(0)} MW</span>
              </div>
            </>
          )}

          {metric === 'zscore' && (
            <>
              <div>
                <span className="month-val-label">{t.zscoreLabel}</span>
                <strong className="month-val-num">
                  {zscore >= 0 ? '+' : ''}
                  {zscore.toFixed(2)}σ
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="month-val-label">{t.harmLabel}</span>
                <span className="month-val-base">{formatMetric(item.harmonized_total)}</span>
              </div>
            </>
          )}
        </div>

        <div className="month-bar-track">
          <div className="month-bar-baseline" title={t.modisAvgLabel} />
          <div className={barClass} style={{ width: `${fillPct}%` }} />
        </div>

        <div className="month-deviation">
          <span>{t.devLabel}</span>
          <strong className={`dev-${item.alert_level}`}>
            {item.deviation_pct >= 0 ? '+' : ''}
            {item.deviation_pct.toFixed(1)}%
          </strong>
        </div>

        {(item.coincident_viirs !== undefined || item.day_count !== undefined) && (
          <div className="month-micro-meta">
            <span title={t.coincShortLabel}>
              C:{item.coincident_viirs ?? 0} / V:{item.viirs_only_small ?? 0}
            </span>
            <span title={t.dayNightShortLabel}>
              D:{item.day_count ?? 0} · N:{item.night_count ?? 0}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="calendar-matrix-section" data-tour="calendar-matrix">
      {diagnostics && (
        <div className="diag-strip">
          <div className="diag-card">
            <div className="diag-icon">
              <Scan size={17} />
            </div>
            <div>
              <span className="diag-title">{t.diagFootprintTitle}</span>
              <p className="diag-sub">
                {t.diagFootprintSub(
                  diagnostics.avg_modis_footprint_km2,
                  diagnostics.avg_viirs_footprint_km2,
                  diagnostics.effective_area_ratio,
                )}
              </p>
            </div>
          </div>

          <div className="diag-card">
            <div className="diag-icon">
              <Activity size={17} />
            </div>
            <div>
              <span className="diag-title">{t.diagCoincTitle}</span>
              <p className="diag-sub">
                {t.diagCoincSub(
                  diagnostics.coincident_viirs,
                  diagnostics.viirs_only_small_fires,
                  diagnostics.viirs_only_pct,
                )}
              </p>
            </div>
          </div>

          <div className="diag-card">
            <div className="diag-icon">
              <Moon size={17} />
            </div>
            <div>
              <span className="diag-title">{t.diagDayNightTitle}</span>
              <p className="diag-sub">
                {t.diagDayNightSub(
                  diagnostics.day_detections,
                  diagnostics.night_detections,
                  diagnostics.night_pct,
                )}
              </p>
            </div>
          </div>

          <div className="diag-card">
            <div className="diag-icon">
              <Flame size={17} />
            </div>
            <div>
              <span className="diag-title">{t.diagFrpTitle}</span>
              <p className="diag-sub">
                {t.diagFrpSub(diagnostics.total_frp_mw, diagnostics.avg_frp_mw)}
              </p>
            </div>
          </div>
        </div>
      )}

      {summary && (
        <div className={`warning-banner warning-${summary.early_warning_status}`}>
          <div className="warning-layout">
            <div className="warning-main">
              <div className="warning-title-row">
                <ShieldAlert size={20} />
                <strong>{t.earlyWarningTitle}</strong>
                <span className={`badge badge-${summary.early_warning_status}`}>
                  <AlertTriangle size={13} />
                  {t.alertLabels[summary.early_warning_status]}
                </span>
              </div>
              <p className="warning-recommendation">
                {formatRecommendation(
                  lang,
                  regionName,
                  summary.early_warning_status,
                  summary.ytd_deviation_pct,
                )}
              </p>
            </div>

            <div className="warning-kpi-cards">
              <div className="warning-kpi-box">
                <span className="warning-kpi-label">
                  {t.ytdLabel} {t.vsBase}
                </span>
                <strong className="warning-kpi-value">
                  {summary.ytd_harmonized.toFixed(1)}
                  <span className="warning-kpi-muted"> / {summary.ytd_historical.toFixed(1)}</span>
                </strong>
                <span className={`warning-kpi-sub dev-${summary.early_warning_status}`}>
                  {summary.ytd_deviation_pct >= 0 ? '+' : ''}
                  {summary.ytd_deviation_pct.toFixed(1)}%
                </span>
              </div>

              <div className="warning-kpi-box">
                <span className="warning-kpi-label">{t.peakLabel}</span>
                <strong className="warning-kpi-value">{peakText}</strong>
              </div>

              <div className="warning-kpi-box">
                <span className="warning-kpi-label">{t.proj60dLabel}</span>
                <strong className={`warning-kpi-value dev-${summary.early_warning_status}`}>
                  {summary.ytd_deviation_pct >= 15
                    ? t.projHigh
                    : summary.ytd_deviation_pct >= 5
                      ? t.projMod
                      : t.projStable}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#f97316" />
              {t.matrixTitle}
            </h2>
            <p className="panel-subtitle">{t.matrixSub}</p>
          </div>

          <div className="matrix-controls-wrap">
            <div className="toggle-group" role="group" aria-label="Matrix metric">
              <button
                type="button"
                className={`toggle-btn ${metric === 'harmonized' ? 'active' : ''}`}
                onClick={() => setMetric('harmonized')}
              >
                {t.metricHarmBtn}
              </button>
              <button
                type="button"
                className={`toggle-btn ${metric === 'frp' ? 'active' : ''}`}
                onClick={() => setMetric('frp')}
              >
                {t.metricFrpBtn}
              </button>
              <button
                type="button"
                className={`toggle-btn ${metric === 'zscore' ? 'active' : ''}`}
                onClick={() => setMetric('zscore')}
              >
                {t.metricZscoreBtn}
              </button>
            </div>

            {onChangeColorRamp && (
              <button
                type="button"
                className="control-select action-btn"
                onClick={() => onChangeColorRamp(colorRamp === 'alert' ? 'viridis' : 'alert')}
                title="Switch color ramp"
              >
                <Eye size={14} />
                {colorRamp === 'viridis' ? t.rampViridisBtn : t.rampAlertBtn}
              </button>
            )}

            <div className="matrix-filter-bar" role="group" aria-label="Filter periods by status">
              {(['all', 'critical', 'elevated', 'normal'] as const).map((status) => {
                const label = status === 'all' ? t.filterAll : t.alertLabels[status];
                return (
                  <button
                    key={status}
                    type="button"
                    className={`filter-pill filter-${status} ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {label} <span className="filter-count">{counts[status]}</span>
                  </button>
                );
              })}
              {isWeekly && statusFilter === 'all' && quarters.length > 1 && (
                <button
                  type="button"
                  className="filter-pill"
                  onClick={toggleAllQuarters}
                >
                  {allQuartersExpanded ? t.collapseQuarters : t.expandAllQuarters}
                </button>
              )}
            </div>
          </div>
        </div>

        {isWeekly ? (
          <div className="quarter-list">
            {quarters.map((quarter) => {
              const critCount = quarter.items.filter((i) => i.alert_level === 'critical').length;
              const elevCount = quarter.items.filter((i) => i.alert_level === 'elevated').length;
              const isExpanded = statusFilter !== 'all' || expandedQuarters.includes(quarter.idx);
              return (
                <div key={quarter.idx} className="quarter-group">
                  <button
                    type="button"
                    className={`quarter-header quarter-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleQuarter(quarter.idx)}
                    aria-expanded={isExpanded}
                  >
                    <div className="quarter-title-row">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <h3>{quarter.title}</h3>
                      <span className="quarter-count">{t.weeksCount(quarter.items.length)}</span>
                    </div>
                    <div className="quarter-badges">
                      {critCount > 0 && (
                        <span className="badge badge-critical">
                          {critCount} {t.alertLabels.critical}
                        </span>
                      )}
                      {elevCount > 0 && (
                        <span className="badge badge-elevated">
                          {elevCount} {t.alertLabels.elevated}
                        </span>
                      )}
                    </div>
                  </button>
                  {isExpanded && <div className="month-grid">{quarter.items.map(renderCard)}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="month-grid">{filteredSeries.map(renderCard)}</div>
        )}
      </div>
    </section>
  );
}
