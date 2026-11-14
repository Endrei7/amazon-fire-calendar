import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Download,
  Flame,
  FlaskConical,
  Globe,
  Grid3X3,
  Layers,
  LayoutGrid,
  MapPin,
  Presentation,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { getFires, getGrid, getRegions, getTimeline } from './api';
import { CalendarMatrix } from './components/CalendarMatrix';
import { FireCalendarChart } from './components/FireCalendarChart';
import { FireMap } from './components/FireMap';
import { MethodologyModal } from './components/MethodologyModal';
import { PitchModeModal } from './components/PitchModeModal';
import { I18N, type Language } from './i18n';
import type {
  FiresResponse,
  Granularity,
  GridResponse,
  RegionInfo,
  SensorFilter,
  TimelineResponse,
} from './types';

export function App() {
  const [lang, setLang] = useState<Language>('pt');
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('amazonia_legal');
  const [sensor, setSensor] = useState<SensorFilter>('both');
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [showRawComparison, setShowRawComparison] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'points' | 'grid'>('points');
  const [methodologyOpen, setMethodologyOpen] = useState<boolean>(false);
  const [pitchOpen, setPitchOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'all' | 'map' | 'chart' | 'alerts'>('all');

  const [firesData, setFiresData] = useState<FiresResponse | null>(null);
  const [gridData, setGridData] = useState<GridResponse | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [loadingFires, setLoadingFires] = useState<boolean>(true);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(true);
  const [loadingGrid, setLoadingGrid] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loading = loadingFires || loadingTimeline || loadingGrid;
  const t = I18N[lang];

  useEffect(() => {
    getRegions()
      .then(setRegions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error loading regions'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingFires(true);
    setError(null);

    getFires(selectedRegion, sensor, 5, 800)
      .then((firesRes) => {
        if (!cancelled) setFiresData(firesRes);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Backend connection error (${err.message}).`
              : 'Error fetching data',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFires(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRegion, sensor]);

  useEffect(() => {
    let cancelled = false;
    setLoadingTimeline(true);
    setError(null);

    getTimeline(selectedRegion, granularity)
      .then((timelineRes) => {
        if (!cancelled) setTimelineData(timelineRes);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Backend connection error (${err.message}).`
              : 'Error fetching data',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTimeline(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRegion, granularity]);

  useEffect(() => {
    let cancelled = false;
    setLoadingGrid(true);
    const cellSize = selectedRegion === 'amazonia_legal' ? 1.5 : 0.8;

    getGrid(selectedRegion, 5, cellSize)
      .then((gridRes) => {
        if (!cancelled) setGridData(gridRes);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Backend connection error (${err.message}).`
              : 'Error fetching data',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGrid(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

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
            <p>{t.subtitle}</p>
          </div>
        </div>

        <div className="controls">
          <select
            className="control-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            aria-label="Region"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="toggle-group" role="group" aria-label="Sensor filter">
            {(['both', 'MODIS', 'VIIRS'] as SensorFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`toggle-btn ${sensor === s ? 'active' : ''}`}
                onClick={() => setSensor(s)}
              >
                {s === 'both' ? t.both : s}
              </button>
            ))}
          </div>

          <div className="toggle-group" role="group" aria-label="Granularity">
            <button
              type="button"
              className={`toggle-btn ${granularity === 'month' ? 'active' : ''}`}
              onClick={() => setGranularity('month')}
            >
              {t.monthly}
            </button>
            <button
              type="button"
              className={`toggle-btn ${granularity === 'week' ? 'active' : ''}`}
              onClick={() => setGranularity('week')}
            >
              {t.weekly}
            </button>
          </div>

          <button
            type="button"
            className="control-select action-btn"
            onClick={() => setLang((prev) => (prev === 'pt' ? 'en' : 'pt'))}
            aria-label="Switch language"
          >
            <Globe size={15} />
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>

          <button
            type="button"
            className="control-select action-btn pitch-btn"
            onClick={() => {
              setMobileTab('all');
              setPitchOpen(true);
            }}
          >
            <Presentation size={15} />
            {t.pitchBtn}
          </button>

          <button
            type="button"
            className="control-select action-btn"
            onClick={() => setMethodologyOpen(true)}
          >
            <FlaskConical size={15} />
            {t.methodologyBtn}
          </button>

          <button
            type="button"
            className="control-select action-btn"
            onClick={handleExportCsv}
            disabled={!timelineData?.series.length}
          >
            <Download size={15} />
            {t.exportBtn}
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="kpi-grid" data-tour="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">{t.kpiHotspots}</div>
          <div className="kpi-value">
            {firesData ? firesData.total_count.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US') : '—'}
          </div>
          <div className="kpi-sub">
            {t.kpiHotspotsSub(
              firesData ? firesData.returned_count : 0,
              sensor === 'both' ? 'MODIS + VIIRS' : sensor,
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">{t.kpiFactor}</div>
          <div className="kpi-value">
            {timelineData ? `× ${timelineData.calibration_factor}` : '—'}
          </div>
          <div className="kpi-sub">{t.kpiFactorSub}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">{t.kpiAlert}</div>
          <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {latestPeriod ? (
              <>
                <span className={`badge badge-${latestPeriod.alert_level}`}>
                  <AlertTriangle size={14} />
                  {t.alertLabels[latestPeriod.alert_level]}
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
          <div className="kpi-sub">{t.kpiAlertSub(latestPeriod?.period)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">{t.kpiSource}</div>
          <div className="kpi-value" style={{ fontSize: '1.05rem', marginTop: '4px' }}>
            <span className={`badge ${isLive ? 'badge-live' : 'badge-elevated'}`}>
              <Radio size={14} />
              {isLive ? t.sourceLive : t.sourceFallback}
            </span>
          </div>
          <div className="kpi-sub">{loading ? t.syncing : t.synced}</div>
        </div>
      </section>

      <main className="main-grid">
        <section
          className={`panel ${mobileTab !== 'all' && mobileTab !== 'map' ? 'mobile-hidden' : ''}`}
          data-tour="map-panel"
        >
          <div className="panel-header">
            <div>
              <h2 className="panel-title">{t.mapTitle(activeRegion.name)}</h2>
              <p className="panel-subtitle">
                {mapMode === 'grid' ? t.mapSubGrid(gridData?.total_cells ?? 0) : t.mapSubPoints}
              </p>
            </div>
            <div className="toggle-group" role="group" aria-label="Map mode">
              <button
                type="button"
                className={`toggle-btn ${mapMode === 'points' ? 'active' : ''}`}
                onClick={() => setMapMode('points')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <MapPin size={14} />
                {t.pointsBtn}
              </button>
              <button
                type="button"
                className={`toggle-btn ${mapMode === 'grid' ? 'active' : ''}`}
                onClick={() => setMapMode('grid')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <Grid3X3 size={14} />
                {t.gridBtn}
              </button>
            </div>
          </div>

          <FireMap
            fires={firesData?.fires ?? []}
            gridCells={gridData?.cells ?? []}
            viewMode={mapMode}
            center={activeRegion.center}
            zoom={activeRegion.zoom}
            lang={lang}
          />

          <div className="legend-row">
            {mapMode === 'grid' ? (
              <>
                <span>
                  <span className="legend-dot" style={{ background: '#ef4444' }} />
                  {t.legendCrit}
                </span>
                <span>
                  <span className="legend-dot" style={{ background: '#f59e0b' }} />
                  {t.legendElev}
                </span>
                <span>
                  <span className="legend-dot" style={{ background: '#10b981' }} />
                  {t.legendNorm}
                </span>
              </>
            ) : (
              <>
                <span>
                  <span className="legend-dot" style={{ background: '#f59e0b' }} />
                  {t.legendModis}
                </span>
                <span>
                  <span className="legend-dot" style={{ background: '#ef4444' }} />
                  {t.legendViirs}
                </span>
              </>
            )}
          </div>
        </section>

        <section
          className={`panel ${mobileTab !== 'all' && mobileTab !== 'chart' ? 'mobile-hidden' : ''}`}
          data-tour="chart-panel"
        >
          <div className="panel-header">
            <div>
              <h2 className="panel-title">{t.chartTitle}</h2>
              <p className="panel-subtitle">
                {showRawComparison ? t.chartSubRaw : t.chartSubHarm}
              </p>
            </div>

            <button
              type="button"
              className="control-select"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowRawComparison((prev) => !prev)}
            >
              <Layers size={15} />
              {showRawComparison ? t.btnShowHarm : t.btnShowRaw}
            </button>
          </div>

          <FireCalendarChart
            series={timelineData?.series ?? []}
            showRawComparison={showRawComparison}
            sensor={sensor}
            lang={lang}
          />
        </section>
      </main>

      <div className={mobileTab !== 'all' && mobileTab !== 'alerts' ? 'mobile-hidden' : ''}>
        <CalendarMatrix
          series={timelineData?.series ?? []}
          summary={timelineData?.summary}
          regionName={activeRegion.name}
          lang={lang}
        />
      </div>

      <MethodologyModal
        open={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
        calibrationFactor={timelineData?.calibration_factor ?? 0.25}
        lang={lang}
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
        lang={lang}
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

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'all' ? 'active' : ''}`}
          onClick={() => setMobileTab('all')}
        >
          <LayoutGrid size={18} />
          <span>{t.navPanel}</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'map' ? 'active' : ''}`}
          onClick={() => setMobileTab('map')}
        >
          <MapPin size={18} />
          <span>{t.navMap}</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'chart' ? 'active' : ''}`}
          onClick={() => setMobileTab('chart')}
        >
          <BarChart3 size={18} />
          <span>{t.navCalendar}</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${mobileTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setMobileTab('alerts')}
        >
          <ShieldAlert size={18} />
          <span>{t.navAlerts}</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${pitchOpen ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('all');
            setPitchOpen(true);
          }}
        >
          <Presentation size={18} />
          <span>{t.navPitch}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
