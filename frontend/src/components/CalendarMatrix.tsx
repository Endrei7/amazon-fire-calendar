import { AlertTriangle, Calendar, ShieldAlert } from 'lucide-react';
import type { AlertLevel, TimelinePoint, TimelineSummary } from '../types';

interface CalendarMatrixProps {
  series: TimelinePoint[];
  summary?: TimelineSummary;
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const STATUS_LABELS: Record<AlertLevel, string> = {
  normal: 'Normal',
  elevated: 'Elevado',
  critical: 'Crítico',
};

function formatPeriodLabel(period: string): string {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-');
    const idx = parseInt(month, 10) - 1;
    const name = MONTH_NAMES[idx] ?? month;
    return `${name}/${year.slice(2)}`;
  }
  return period;
}

export function CalendarMatrix({ series, summary }: CalendarMatrixProps) {
  return (
    <section className="calendar-matrix-section" data-tour="calendar-matrix">
      {summary && (
        <div className={`warning-banner warning-${summary.early_warning_status}`}>
          <div className="warning-banner-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <ShieldAlert size={20} />
              <strong>Diagnóstico de Alerta Precoce</strong>
              <span className={`badge badge-${summary.early_warning_status}`}>
                <AlertTriangle size={13} />
                {STATUS_LABELS[summary.early_warning_status]}
              </span>
            </div>
            <div className="warning-metrics">
              <span>
                Acumulado: <strong>{summary.ytd_harmonized}</strong> vs. Base{' '}
                <strong>{summary.ytd_historical}</strong> ({summary.ytd_deviation_pct >= 0 ? '+' : ''}
                {summary.ytd_deviation_pct}%)
              </span>
              <span>
                Pico: <strong>{formatPeriodLabel(summary.peak_period)}</strong>
              </span>
              <span>
                Projeção 60d:{' '}
                <strong>
                  {summary.ytd_deviation_pct >= 15
                    ? 'Tendência de Alta Crítica'
                    : summary.ytd_deviation_pct >= 5
                      ? 'Aceleração Moderada'
                      : 'Estável'}
                </strong>
              </span>
            </div>
          </div>
          <p className="warning-recommendation">{summary.recommendation}</p>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#f97316" />
              Matriz do Calendário (Série Temporal Harmonizada)
            </h2>
            <p className="panel-subtitle">
              Cada bloco compara o índice harmonizado (MODIS + VIIRS calibrado) contra a média histórica MODIS
            </p>
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
                  <span className="month-name">{formatPeriodLabel(item.period)}</span>
                  <span className={`badge badge-${item.alert_level}`}>
                    {STATUS_LABELS[item.alert_level]}
                  </span>
                </div>
                <div className="month-values">
                  <div>
                    <span className="month-val-label">Harmonizado</span>
                    <strong className="month-val-num">{item.harmonized_total}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="month-val-label">Média MODIS</span>
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
                  Desvio: {item.deviation_pct >= 0 ? '+' : ''}
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
