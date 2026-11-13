import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Flame,
  FlaskConical,
  Grid3X3,
  Layers,
  MapPin,
  Presentation,
  Radio,
} from 'lucide-react';
import { getFires, getGrid, getRegions, getTimeline } from './api';
import { CalendarMatrix } from './components/CalendarMatrix';
import { FireCalendarChart } from './components/FireCalendarChart';
import { FireMap } from './components/FireMap';
import { MethodologyModal } from './components/MethodologyModal';
import { PitchModeModal } from './components/PitchModeModal';
import type {
  FiresResponse,
  Granularity,
  GridResponse,
  RegionInfo,
  SensorFilter,
  TimelineResponse,
} from './types';

const ALERT_LABELS = {
  normal: 'Normal',
  elevated: 'Elevado',
  critical: 'Crítico',
} as const;

export function App() {
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('amazonia_legal');
  const [sensor, setSensor] = useState<SensorFilter>('both');
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [showRawComparison, setShowRawComparison] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'points' | 'grid'>('points');
  const [methodologyOpen, setMethodologyOpen] = useState<boolean>(false);
  const [pitchOpen, setPitchOpen] = useState<boolean>(false);

  const [firesData, setFiresData] = useState<FiresResponse | null>(null);
  const [gridData, setGridData] = useState<GridResponse | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRegions()
      .then(setRegions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar regiões'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const cellSize = selectedRegion === 'amazonia_legal' ? 1.5 : 0.8;

    Promise.all([
      getFires(selectedRegion, sensor, 5, 800),
      getTimeline(selectedRegion, granularity),
      getGrid(selectedRegion, 5, cellSize),
    ])
      .then(([firesRes, timelineRes, gridRes]) => {
        if (cancelled) return;
        setFiresData(firesRes);
        setTimelineData(timelineRes);
        setGridData(gridRes);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? `Não foi possível conectar ao backend (${err.message}). Verifique se o uvicorn está rodando na porta 8000.`
            : 'Erro ao buscar dados',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRegion, sensor, granularity]);

  const activeRegion = useMemo(
    () =>
      regions.find((r) => r.id === selectedRegion) ?? {
        id: 'amazonia_legal',
        name: 'Amazônia Legal',
        bbox: [-74, -18, -44, 5.5] as [number, number, number, number],
        center: [-5.5, -59.5] as [number, number],
        zoom: 5,
      },
    [regions, selectedRegion],
  );

  const latestPeriod = timelineData?.series[timelineData.series.length - 1];
  const isLive = firesData?.data_source === 'live_nasa_firms';

  const handleExportCsv = () => {
    if (!timelineData?.series.length) return;
    const headers = [
      'period',
      'modis_raw',
      'viirs_raw',
      'viirs_normalized',
      'harmonized_total',
      'historical_avg',
      'deviation_pct',
      'alert_level',
    ];
    const rows = timelineData.series.map((item) =>
      headers.map((h) => String(item[h as keyof typeof item])).join(','),
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendario_harmonizado_${selectedRegion}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header className="topbar" data-tour="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Flame size={22} />
          </div>
          <div>
            <h1>Amazon Fire Calendar</h1>
            <p>Harmonização MODIS (1km) + VIIRS (375m) via NASA FIRMS</p>
          </div>
        </div>

        <div className="controls">
          <select
            className="control-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            aria-label="Selecionar região"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="toggle-group" role="group" aria-label="Filtro de sensor">
            {(['both', 'MODIS', 'VIIRS'] as SensorFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`toggle-btn ${sensor === s ? 'active' : ''}`}
                onClick={() => setSensor(s)}
              >
                {s === 'both' ? 'Ambos' : s}
              </button>
            ))}
          </div>

          <div className="toggle-group" role="group" aria-label="Granularidade">
            <button
              type="button"
              className={`toggle-btn ${granularity === 'month' ? 'active' : ''}`}
              onClick={() => setGranularity('month')}
            >
              Mensal
            </button>
            <button
              type="button"
              className={`toggle-btn ${granularity === 'week' ? 'active' : ''}`}
              onClick={() => setGranularity('week')}
            >
              Semanal
            </button>
          </div>

          <button
            type="button"
            className="control-select action-btn pitch-btn"
            onClick={() => setPitchOpen(true)}
          >
            <Presentation size={15} />
            Modo Pitch
          </button>

          <button
            type="button"
            className="control-select action-btn"
            onClick={() => setMethodologyOpen(true)}
          >
            <FlaskConical size={15} />
            Metodologia NASA
          </button>

          <button
            type="button"
            className="control-select action-btn"
            onClick={handleExportCsv}
            disabled={!timelineData?.series.length}
          >
            <Download size={15} />
            Exportar CSV
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="kpi-grid" data-tour="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Focos Detectados (Mapa)</div>
          <div className="kpi-value">{firesData ? firesData.total_count.toLocaleString('pt-BR') : '—'}</div>
          <div className="kpi-sub">
            Exibindo {firesData ? firesData.returned_count : 0} pontos recentes ({sensor === 'both' ? 'MODIS + VIIRS' : sensor})
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Fator de Harmonização</div>
          <div className="kpi-value">
            {timelineData ? `× ${timelineData.calibration_factor}` : '—'}
          </div>
          <div className="kpi-sub">
            Converte contagem VIIRS (375m) para escala histórica MODIS (1km)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Alerta do Último Período</div>
          <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {latestPeriod ? (
              <>
                <span className={`badge badge-${latestPeriod.alert_level}`}>
                  <AlertTriangle size={14} />
                  {ALERT_LABELS[latestPeriod.alert_level]}
                </span>
                <span style={{ fontSize: '1rem', color: '#9ca3af' }}>
                  {latestPeriod.deviation_pct >= 0 ? '+' : ''}
                  {latestPeriod.deviation_pct}%
                </span>
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="kpi-sub">
            {latestPeriod ? `Período ${latestPeriod.period} vs. média MODIS` : 'Aguardando série'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Fonte de Dados</div>
          <div className="kpi-value" style={{ fontSize: '1.05rem', marginTop: '4px' }}>
            <span className={`badge ${isLive ? 'badge-live' : 'badge-elevated'}`}>
              <Radio size={14} />
              {isLive ? 'NASA FIRMS Ao Vivo' : 'CSV Local (Fallback)'}
            </span>
          </div>
          <div className="kpi-sub">{loading ? 'Atualizando painel...' : 'Sincronizado'}</div>
        </div>
      </section>

      <main className="main-grid">
        <section className="panel" data-tour="map-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Mapa de Focos de Calor — {activeRegion.name}</h2>
              <p className="panel-subtitle">
                {mapMode === 'grid'
                  ? `Grid espacial harmonizado (${gridData?.total_cells ?? 0} quadrantes ativos)`
                  : 'Clique em qualquer ponto para ver satélite, horário e potência radiativa (FRP)'}
              </p>
            </div>
            <div className="toggle-group" role="group" aria-label="Modo do mapa">
              <button
                type="button"
                className={`toggle-btn ${mapMode === 'points' ? 'active' : ''}`}
                onClick={() => setMapMode('points')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <MapPin size={14} />
                Pontos
              </button>
              <button
                type="button"
                className={`toggle-btn ${mapMode === 'grid' ? 'active' : ''}`}
                onClick={() => setMapMode('grid')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Grid3X3 size={14} />
                Grid Harmonizado
              </button>
            </div>
          </div>

          <FireMap
            fires={firesData?.fires ?? []}
            gridCells={gridData?.cells ?? []}
            viewMode={mapMode}
            center={activeRegion.center}
            zoom={activeRegion.zoom}
          />

          <div className="legend-row">
            {mapMode === 'grid' ? (
              <>
                <span>
                  <span className="legend-dot" style={{ background: '#ef4444' }} />
                  Quadrante Crítico
                </span>
                <span>
                  <span className="legend-dot" style={{ background: '#f59e0b' }} />
                  Quadrante Elevado
                </span>
                <span>
                  <span className="legend-dot" style={{ background: '#10b981' }} />
                  Quadrante Normal
                </span>
              </>
            ) : (
              <>
                <span>
                  <span className="legend-dot" style={{ background: '#f59e0b' }} />
                  MODIS (1km — série histórica)
                </span>
                <span>
                  <span className="legend-dot" style={{ background: '#ef4444' }} />
                  VIIRS (375m — alta resolução)
                </span>
              </>
            )}
          </div>
        </section>

        <section className="panel" data-tour="chart-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Calendário de Queimadas (MODIS ↔ VIIRS)</h2>
              <p className="panel-subtitle">
                {showRawComparison
                  ? 'Comparação bruta: VIIRS parece muito maior só pela resolução de 375m'
                  : 'Série harmonizada na régua do MODIS vs. média histórica'}
              </p>
            </div>

            <button
              type="button"
              className="control-select"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowRawComparison((prev) => !prev)}
            >
              <Layers size={15} />
              {showRawComparison ? 'Ver Harmonizado' : 'Ver Dados Brutos'}
            </button>
          </div>

          <FireCalendarChart
            series={timelineData?.series ?? []}
            showRawComparison={showRawComparison}
          />
        </section>
      </main>

      <CalendarMatrix
        series={timelineData?.series ?? []}
        summary={timelineData?.summary}
      />

      <footer className="pitch-note">
        <strong>Por que este painel importa para Manaus e a Amazônia?</strong> Como o sensor{' '}
        <strong>VIIRS (375m)</strong> enxerga cerca de 4× mais focos que o antigo{' '}
        <strong>MODIS (1km)</strong> para o mesmo incêndio, comparar números brutos gera falsos alarmes.
        Ao clicar em <em>“Ver Dados Brutos”</em> vs. <em>“Ver Harmonizado”</em>, provamos como a calibração
        coloca os dois satélites na mesma régua para antecipar crises antes do pico de agosto–setembro.
      </footer>

      <MethodologyModal
        open={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
        calibrationFactor={timelineData?.calibration_factor ?? 0.25}
      />

      <PitchModeModal
        open={pitchOpen}
        onClose={() => setPitchOpen(false)}
        regionName={activeRegion.name}
        totalFires={firesData?.total_count ?? 0}
        calibrationFactor={timelineData?.calibration_factor ?? 0.25}
        summary={timelineData?.summary}
        mapMode={mapMode}
        showRawComparison={showRawComparison}
        onTriggerDemoAction={(action) => {
          if (action === 'raw') {
            setShowRawComparison(true);
          } else if (action === 'harmonized') {
            setShowRawComparison(false);
          } else if (action === 'grid') {
            setMapMode('grid');
          } else if (action === 'points') {
            setMapMode('points');
          }
        }}
      />
    </div>
  );
}

export default App;
