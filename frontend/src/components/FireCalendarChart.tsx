import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { I18N, type Language } from '../i18n';
import type { TimelinePoint } from '../types';

interface FireCalendarChartProps {
  series: TimelinePoint[];
  showRawComparison: boolean;
  lang: Language;
}

export function FireCalendarChart({ series, showRawComparison, lang }: FireCalendarChartProps) {
  const t = I18N[lang];

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="period" stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />

          {showRawComparison ? (
            <>
              <Bar dataKey="modis_raw" name={t.seriesModisRaw} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="viirs_raw" name={t.seriesViirsRaw} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </>
          ) : (
            <>
              <Bar dataKey="modis_raw" name={t.seriesModis} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="viirs_normalized"
                name={t.seriesViirsNorm}
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="harmonized_total"
                name={t.seriesHarmIndex}
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="historical_avg"
                name={t.seriesHistAvg}
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
