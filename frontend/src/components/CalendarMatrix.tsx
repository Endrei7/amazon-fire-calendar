import { AlertTriangle, Calendar, ShieldAlert } from 'lucide-react';
import { formatRecommendation, I18N, type Language } from '../i18n';
import type { TimelinePoint, TimelineSummary } from '../types';

interface CalendarMatrixProps {
  series: TimelinePoint[];
  summary?: TimelineSummary;
  regionName: string;
  lang: Language;
}

function formatPeriodLabel(period: string, months: readonly string[]): string {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-');
    const idx = parseInt(month, 10) - 1;
    const name = months[idx] ?? month;
    return `${name}/${year.slice(2)}`;
  }
  return period;
}

export function CalendarMatrix({ series, summary, regionName, lang }: CalendarMatrixProps) {
  const t = I18N[lang];

  return (
    <section className="calendar-matrix-section" data-tour="calendar-matrix">
      {summary && (
        <div className={`warning-banner warning-${summary.early_warning_status}`}>
          <div className="warning-banner-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <ShieldAlert size={20} />
              <strong>{t.earlyWarningTitle}</strong>
              <span className={`badge badge-${summary.early_warning_status}`}>
                <AlertTriangle size={13} />
                {t.alertLabels[summary.early_warning_status]}
              </span>
            </div>
            <div className="warning-metrics">
              <span>
                {t.ytdLabel}: <strong>{summary.ytd_harmonized}</strong> {t.vsBase}{' '}
                <strong>{summary.ytd_historical}</strong> ({summary.ytd_deviation_pct >= 0 ? '+' : ''}
                {summary.ytd_deviation_pct}%)
              </span>
              <span>
                {t.peakLabel}: <strong>{formatPeriodLabel(summary.peak_period, t.months)}</strong>
              </span>
              <span>
                {t.proj60dLabel}:{' '}
                <strong>
                  {summary.ytd_deviation_pct >= 15
                    ? t.projHigh
                    : summary.ytd_deviation_pct >= 5
                      ? t.projMod
                      : t.projStable}
                </strong>
              </span>
            </div>
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
        </div>

        <div className="month-grid">
          {series.map((item) => {
            const fillPct = Math.min(
              100,
              item.historical_avg > 0 ? Math.round((item.harmonized_total / item.historical_avg) * 50) : 50,
            );
            return (
              <div key={item.period} className={`month-card month-${item.alert_level}`}>
                <div className="month-card-top">
                  <span className="month-name">{formatPeriodLabel(item.period, t.months)}</span>
                  <span className={`badge badge-${item.alert_level}`}>
                    {t.alertLabels[item.alert_level]}
                  </span>
                </div>
                <div className="month-values">
                  <div>
                    <span className="month-val-label">{t.harmLabel}</span>
                    <strong className="month-val-num">{item.harmonized_total}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="month-val-label">{t.modisAvgLabel}</span>
                    <span className="month-val-base">{item.historical_avg}</span>
                  </div>
                </div>
                <div className="month-bar-track">
                  <div
                    className={`month-bar-fill bar-${item.alert_level}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <div className="month-deviation">
                  {t.devLabel}: {item.deviation_pct >= 0 ? '+' : ''}
                  {item.deviation_pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
