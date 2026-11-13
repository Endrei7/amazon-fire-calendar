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
import type { TimelinePoint } from '../types';

interface FireCalendarChartProps {
  series: TimelinePoint[];
  showRawComparison: boolean;
}

export function FireCalendarChart({ series, showRawComparison }: FireCalendarChartProps) {
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
              <Bar dataKey="modis_raw" name="MODIS Bruto (1km)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="viirs_raw" name="VIIRS Bruto (375m)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </>
          ) : (
            <>
              <Bar dataKey="modis_raw" name="MODIS (1km)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="viirs_normalized"
                name="VIIRS Normalizado (escala MODIS)"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="harmonized_total"
                name="Índice Harmonizado"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="historical_avg"
                name="Média Histórica MODIS"
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
