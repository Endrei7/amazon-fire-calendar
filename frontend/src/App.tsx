import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Crosshair,
  Download,
  Flame,
  FlaskConical,
  Globe,
  Grid3X3,
  LayoutGrid,
  MapPin,
  Presentation,
  Radio,
  Scan,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { getFires, getGrid, getRegions, getTimeline } from './api';
import { BurningHeatmap } from './components/BurningHeatmap';
import { CalendarMatrix } from './components/CalendarMatrix';
import { FireCalendarChart } from './components/FireCalendarChart';
import { FireMap } from './components/FireMap';
import { HarmonizationLab } from './components/HarmonizationLab';
import { PitchModeModal, type WorkspaceView } from './components/PitchModeModal';
import { formatRecommendation, I18N, type Language } from './i18n';
import type {
  ChartViewMode,
  ColorRamp,
  ConfidenceFilter,
  DayNightFilter,
  FiresResponse,
  Granularity,
  GridResponse,
  MapViewMode,
  RegionInfo,
  SensorFilter,
  TimelineResponse,
} from './types';

export function App() {
  const [lang, setLang] = useState<Language>('pt');
  const [activeView, setActiveView] = useState<WorkspaceView>('overview');
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('amazonia_legal');
  const [sensor, setSensor] = useState<SensorFilter>('both');
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [daynight, setDaynight] = useState<DayNightFilter>('all');
  const [minConfidence, setMinConfidence] = useState<ConfidenceFilter>('all');
  const [viirsOnlyWeight, setViirsOnlyWeight] = useState<number>(0.85);
  const [colorRamp, setColorRamp] = useState<ColorRamp>('alert');

  const [subfiltersOpen, setSubfiltersOpen] = useState<boolean>(false);
  const [customBbox, setCustomBbox] = useState<[number, number, number, number] | null>(null);
  const [aoiPanelOpen, setAoiPanelOpen] = useState<boolean>(false);
  const [isDrawingAoi, setIsDrawingAoi] = useState<boolean>(false);
  const [bboxInputs, setBboxInputs] = useState<{
    west: string;
    south: string;
    east: string;
    north: string;
  }>({
    west: '-64.5',
    south: '-9.5',
    east: '-58.5',
    north: '-2.5',
  });

  const [chartMode, setChartMode] = useState<ChartViewMode>('harmonized');
  const [mapMode, setMapMode] = useState<MapViewMode>('points');
  const [pitchOpen, setPitchOpen] = useState<boolean>(false);

  const [firesData, setFiresData] = useState<FiresResponse | null>(null);
  const [gridData, setGridData] = useState<GridResponse | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [loadingFires, setLoadingFires] = useState<boolean>(true);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(true);
  const [loadingGrid, setLoadingGrid] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loading = loadingFires || loadingTimeline || loadingGrid;
  const t = I18N[lang];
  const bboxParam = customBbox ? customBbox.join(',') : null;

  useEffect(() => {
    getRegions()
      .then(setRegions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error loading regions'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingFires(true);
    setError(null);

    getFires(selectedRegion, sensor, 5, 800, {
      bbox: bboxParam,
      daynight,
      minConfidence,
    })
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
  }, [selectedRegion, sensor, bboxParam, daynight, minConfidence]);

  useEffect(() => {
    let cancelled = false;
    setLoadingTimeline(true);
    setError(null);

    getTimeline(selectedRegion, granularity, {
      bbox: bboxParam,
      daynight,
      minConfidence,
      viirsOnlyWeight,
    })
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
  }, [selectedRegion, granularity, bboxParam, daynight, minConfidence, viirsOnlyWeight]);

  useEffect(() => {
    let cancelled = false;
    setLoadingGrid(true);
    const cellSize = customBbox
      ? Math.max(0.35, Math.min(1.2, Number(((customBbox[2] - customBbox[0]) / 6).toFixed(2))))
      : selectedRegion === 'amazonia_legal'
        ? 1.5
        : 0.8;

    getGrid(selectedRegion, 5, cellSize, {
      bbox: bboxParam,
      daynight,
      minConfidence,
    })
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
  }, [selectedRegion, bboxParam, daynight, minConfidence, customBbox]);

  const activeRegion = useMemo(() => {
    if (customBbox) {
      const [w, s, e, n] = customBbox;
      const span = Math.max(e - w, n - s);
      return {
        id: 'custom_aoi',
        name: `${t.aoiActiveLabel} (${s.toFixed(1)}°, ${w.toFixed(1)}° → ${n.toFixed(1)}°, ${e.toFixed(1)}°)`,
        bbox: customBbox,
        center: [Number(((s + n) / 2).toFixed(3)), Number(((w + e) / 2).toFixed(3))] as [
          number,
          number,
        ],
        zoom: span < 3 ? 8 : span < 6 ? 7 : span < 14 ? 6 : 5,
      };
    }
    return (
      regions.find((r) => r.id === selectedRegion) ?? {
        id: 'amazonia_legal',
        name: 'Amazônia Legal',
        bbox: [-74, -18, -44, 5.5] as [number, number, number, number],
        center: [-5.5, -59.5] as [number, number],
        zoom: 5,
      }
    );
  }, [regions, selectedRegion, customBbox, t.aoiActiveLabel]);

  const latestPeriod = timelineData?.series[timelineData.series.length - 1];
  const isLive = firesData?.data_source === 'live_nasa_firms';
  const summary = timelineData?.summary;
  const calibrationFactor = timelineData?.calibration_factor ?? 0.25;
  const hasActiveSubfilters =
    subfiltersOpen || daynight !== 'all' || minConfidence !== 'all' || customBbox !== null;

  const handleApplyCoords = () => {
    const w = parseFloat(bboxInputs.west);
    const s = parseFloat(bboxInputs.south);
    const e = parseFloat(bboxInputs.east);
    const n = parseFloat(bboxInputs.north);
    if (!Number.isNaN(w) && !Number.isNaN(s) && !Number.isNaN(e) && !Number.isNaN(n) && w < e && s < n) {
      setCustomBbox([w, s, e, n]);
      setIsDrawingAoi(false);
    }
  };

  const handleMapSelectBbox = (bbox: [number, number, number, number]) => {
    setCustomBbox(bbox);
    setBboxInputs({
      west: String(bbox[0]),
      south: String(bbox[1]),
      east: String(bbox[2]),
      north: String(bbox[3]),
    });
    setIsDrawingAoi(false);
  };

  const handleExportCsv = () => {
    if (!timelineData?.series.length) return;
    const headers = [
      'period',
      'modis_raw',
      'viirs_raw',
      'coincident_viirs',
      'viirs_only_small',
      'viirs_normalized',
      'harmonized_total',
      'historical_avg',
      'deviation_pct',
      'anomaly_zscore',
      'modis_frp',
      'viirs_frp',
      'harmonized_frp',
      'day_count',
      'night_count',
      'alert_level',
    ];
    const rows = timelineData.series.map((item) =>
      headers.map((h) => String(item[h as keyof typeof item] ?? '')).join(','),
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendario_harmonizado_${customBbox ? 'custom_aoi' : selectedRegion}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header className="workspace-header">
        <div className="topbar-main" data-tour="topbar">
          <div className="brand">
            <div className="brand-icon">
              <Flame size={20} />
            </div>
            <div>
              <div className="brand-title-row">
                <h1>Amazon Fire Calendar</h1>
                <span className={`badge badge-compact ${isLive ? 'badge-live' : 'badge-elevated'}`}>
                  <Radio size={12} />
                  {loading ? t.syncing : isLive ? t.sourceLive : t.sourceFallback}
                </span>
              </div>
              <p>{t.subtitle}</p>
            </div>
          </div>

          <nav className="view-tabs" aria-label="Workspace views">
            <button
              type="button"
              className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              <LayoutGrid size={15} />
              {t.tabOverview}
            </button>
            <button
              type="button"
              className={`view-tab ${activeView === 'matrix' ? 'active' : ''}`}
              onClick={() => setActiveView('matrix')}
            >
              <Calendar size={15} />
              {t.tabMatrix}
            </button>
            <button
              type="button"
              className={`view-tab ${activeView === 'science' ? 'active' : ''}`}
              onClick={() => setActiveView('science')}
            >
              <FlaskConical size={15} />
              {t.tabScience}
            </button>
          </nav>

          <div className="controls utility-actions">
            <button
              type="button"
              className="control-select action-btn pitch-btn"
              onClick={() => setPitchOpen(true)}
            >
              <Presentation size={15} />
              {t.pitchBtn}
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

            <button
              type="button"
              className="control-select action-btn"
              onClick={() => setLang((prev) => (prev === 'pt' ? 'en' : 'pt'))}
              aria-label="Switch language"
            >
              <Globe size={15} />
              {lang === 'pt' ? 'EN' : 'PT'}
            </button>
          </div>
        </div>

        <div className="filter-kpi-strip" data-tour="kpi-grid">
          <div className="controls filter-controls">
            <select
              className="control-select"
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCustomBbox(null);
              }}
              aria-label="Region"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`control-select action-btn ${customBbox || aoiPanelOpen ? 'aoi-active-btn' : ''}`}
              onClick={() => setAoiPanelOpen((prev) => !prev)}
            >
              <Crosshair size={14} />
              {t.customAoiBtn}
            </button>

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
              className={`control-select action-btn ${subfiltersOpen || daynight !== 'all' || minConfidence !== 'all' ? 'aoi-active-btn' : ''}`}
              onClick={() => setSubfiltersOpen((prev) => !prev)}
            >
              <SlidersHorizontal size={14} />
              {t.advFiltersBtn}
            </button>
          </div>

          <div className="kpi-inline-group">
            <div className="kpi-mini-pill">
              <span className="kpi-mini-label">{t.kpiHotspots}</span>
              <strong className="kpi-mini-value">
                {firesData ? firesData.total_count.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US') : '—'}
              </strong>
            </div>

            <div className="kpi-mini-pill">
              <span className="kpi-mini-label">{t.kpiFactor}</span>
              <strong className="kpi-mini-value">
                {timelineData ? `× ${timelineData.calibration_factor}` : '—'}
              </strong>
            </div>

            <div className="kpi-mini-pill">
              <span className="kpi-mini-label">
                {t.kpiAlert} {latestPeriod ? `(${latestPeriod.period})` : ''}
              </span>
              <div className="kpi-mini-alert">
                {latestPeriod ? (
                  <>
                    <span className={`badge badge-${latestPeriod.alert_level}`}>
                      <AlertTriangle size={12} />
                      {t.alertLabels[latestPeriod.alert_level]}
                    </span>
                    <strong className={`dev-${latestPeriod.alert_level}`}>
                      {latestPeriod.deviation_pct >= 0 ? '+' : ''}
                      {latestPeriod.deviation_pct}%
                    </strong>
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>
          </div>
        </div>

        {hasActiveSubfilters && (
          <div className="subfilter-bar">
            <div className="subfilter-group">
              <SlidersHorizontal size={14} color="#f97316" />
              <select
                className="control-select control-select-sm"
                value={daynight}
                onChange={(e) => setDaynight(e.target.value as DayNightFilter)}
                aria-label="Day Night Filter"
              >
                <option value="all">{t.dayNightAll}</option>
                <option value="D">{t.dayOnly}</option>
                <option value="N">{t.nightOnly}</option>
              </select>

              <select
                className="control-select control-select-sm"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value as ConfidenceFilter)}
                aria-label="Confidence Filter"
              >
                <option value="all">{t.confAll}</option>
                <option value="nominal">{t.confNominal}</option>
                <option value="high">{t.confHigh}</option>
              </select>

              <label className="weight-control">
                <span>{t.viirsWeightLabel}:</span>
                <select
                  className="control-select control-select-sm"
                  value={String(viirsOnlyWeight)}
                  onChange={(e) => setViirsOnlyWeight(parseFloat(e.target.value))}
                >
                  <option value="1">1.00× (Sem Desconto)</option>
                  <option value="0.85">0.85× (Padrão NASA)</option>
                  <option value="0.7">0.70× (Conservador)</option>
                  <option value="0.5">0.50× (Foco Grandes Incêndios)</option>
                </select>
              </label>
            </div>

            {customBbox && (
              <div className="active-aoi-pill">
                <Crosshair size={13} />
                <span>{activeRegion.name}</span>
                <button
                  type="button"
                  className="aoi-clear-inline"
                  onClick={() => {
                    setCustomBbox(null);
                    setIsDrawingAoi(false);
                  }}
                >
                  <X size={13} />
                  {t.clearAoiBtn}
                </button>
              </div>
            )}
          </div>
        )}

        {aoiPanelOpen && (
          <div className="aoi-drawer">
            <div className="aoi-drawer-top">
              <span>{t.aoiInstruction}</span>
              <div className="aoi-actions">
                <button
                  type="button"
                  className={`control-select action-btn ${isDrawingAoi ? 'pitch-btn' : ''}`}
                  onClick={() => {
                    setActiveView('overview');
                    setIsDrawingAoi((prev) => !prev);
                  }}
                >
                  <Crosshair size={14} />
                  {isDrawingAoi ? t.cancelDrawBtn : t.drawAoiBtn}
                </button>
                {customBbox && (
                  <button
                    type="button"
                    className="control-select action-btn"
                    onClick={() => {
                      setCustomBbox(null);
                      setIsDrawingAoi(false);
                    }}
                  >
                    <X size={14} />
                    {t.clearAoiBtn}
                  </button>
                )}
              </div>
            </div>

            <div className="aoi-coords-row">
              <label>
                <span>West (Lon)</span>
                <input
                  type="number"
                  step="0.5"
                  value={bboxInputs.west}
                  onChange={(e) => setBboxInputs((s) => ({ ...s, west: e.target.value }))}
                />
              </label>
              <label>
                <span>South (Lat)</span>
                <input
                  type="number"
                  step="0.5"
                  value={bboxInputs.south}
                  onChange={(e) => setBboxInputs((s) => ({ ...s, south: e.target.value }))}
                />
              </label>
              <label>
                <span>East (Lon)</span>
                <input
                  type="number"
                  step="0.5"
                  value={bboxInputs.east}
                  onChange={(e) => setBboxInputs((s) => ({ ...s, east: e.target.value }))}
                />
              </label>
              <label>
                <span>North (Lat)</span>
                <input
                  type="number"
                  step="0.5"
                  value={bboxInputs.north}
                  onChange={(e) => setBboxInputs((s) => ({ ...s, north: e.target.value }))}
                />
              </label>
              <button
                type="button"
                className="control-select action-btn pitch-btn"
                onClick={handleApplyCoords}
              >
                {t.applyCoordsBtn}
              </button>
            </div>
          </div>
        )}
      </header>

      {error && <div className="error-banner">{error}</div>}

      {activeView === 'overview' && (
        <>
          <main className="main-grid">
            <section className="panel" data-tour="map-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">{t.mapTitle(activeRegion.name)}</h2>
                  <p className="panel-subtitle">
                    {mapMode === 'grid'
                      ? t.mapSubGrid(gridData?.total_cells ?? 0)
                      : mapMode === 'footprints'
                        ? t.mapSubFootprints
                        : t.mapSubPoints}
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
                    className={`toggle-btn ${mapMode === 'footprints' ? 'active' : ''}`}
                    onClick={() => setMapMode('footprints')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Scan size={14} />
                    {t.footprintsBtn}
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
                colorRamp={colorRamp}
                center={activeRegion.center}
                zoom={activeRegion.zoom}
                lang={lang}
                customBbox={customBbox}
                isDrawingAoi={isDrawingAoi}
                onSelectBbox={handleMapSelectBbox}
              />

              <div className="legend-row">
                {mapMode === 'grid' ? (
                  <>
                    <span>
                      <span
                        className="legend-dot"
                        style={{ background: colorRamp === 'viridis' ? '#fde725' : '#ef4444' }}
                      />
                      {t.legendCrit}
                    </span>
                    <span>
                      <span
                        className="legend-dot"
                        style={{ background: colorRamp === 'viridis' ? '#21918c' : '#f59e0b' }}
                      />
                      {t.legendElev}
                    </span>
                    <span>
                      <span
                        className="legend-dot"
                        style={{ background: colorRamp === 'viridis' ? '#440154' : '#10b981' }}
                      />
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
                {customBbox && (
                  <span>
                    <span className="legend-dot" style={{ background: '#38bdf8' }} />
                    {t.legendAoi}
                  </span>
                )}
              </div>
            </section>

            <section className="panel" data-tour="chart-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">{t.chartTitle}</h2>
                  <p className="panel-subtitle">
                    {chartMode === 'raw'
                      ? t.chartSubRaw
                      : chartMode === 'coincidence'
                        ? t.chartSubCoincidence
                        : chartMode === 'frp'
                          ? t.chartSubFrp
                          : t.chartSubHarm}
                  </p>
                </div>

                <div className="toggle-group" role="group" aria-label="Chart mode">
                  <button
                    type="button"
                    className={`toggle-btn ${chartMode === 'harmonized' ? 'active' : ''}`}
                    onClick={() => setChartMode('harmonized')}
                  >
                    {t.chartModeHarm}
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${chartMode === 'raw' ? 'active' : ''}`}
                    onClick={() => setChartMode('raw')}
                  >
                    {t.chartModeRaw}
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${chartMode === 'coincidence' ? 'active' : ''}`}
                    onClick={() => setChartMode('coincidence')}
                  >
                    {t.chartModeCoinc}
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${chartMode === 'frp' ? 'active' : ''}`}
                    onClick={() => setChartMode('frp')}
                  >
                    {t.chartModeFrp}
                  </button>
                </div>
              </div>

              <FireCalendarChart
                series={timelineData?.series ?? []}
                chartMode={chartMode}
                sensor={sensor}
                lang={lang}
              />
            </section>
          </main>

          {summary && (
            <section className={`compact-alert-strip warning-${summary.early_warning_status}`}>
              <div className="compact-alert-left">
                <span className={`badge badge-${summary.early_warning_status}`}>
                  <AlertTriangle size={13} />
                  {t.alertLabels[summary.early_warning_status]}
                </span>
                <p className="compact-alert-text">
                  {formatRecommendation(
                    lang,
                    activeRegion.name,
                    summary.early_warning_status,
                    summary.ytd_deviation_pct,
                  )}
                </p>
              </div>
              <div className="compact-alert-right">
                <span className="compact-alert-peak">
                  {t.peakLabel}: <strong>{summary.peak_period}</strong>
                </span>
                <button
                  type="button"
                  className="control-select action-btn"
                  onClick={() => setActiveView('matrix')}
                >
                  {t.openMatrixCta}
                </button>
                <button
                  type="button"
                  className="control-select action-btn"
                  onClick={() => setActiveView('science')}
                >
                  {t.openLabCta}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {activeView === 'matrix' && (
        <div className="matrix-view-stack">
          <BurningHeatmap
            series={timelineData?.series ?? []}
            colorRamp={colorRamp}
            lang={lang}
          />
          <CalendarMatrix
            series={timelineData?.series ?? []}
            summary={summary}
            diagnostics={timelineData?.diagnostics}
            regionName={activeRegion.name}
            lang={lang}
            colorRamp={colorRamp}
            onChangeColorRamp={setColorRamp}
          />
        </div>
      )}

      {activeView === 'science' && (
        <div className="science-view-stack">
          <HarmonizationLab
            diagnostics={timelineData?.diagnostics}
            summary={summary}
            calibrationFactor={calibrationFactor}
            viirsOnlyWeight={viirsOnlyWeight}
            onChangeViirsWeight={setViirsOnlyWeight}
            lang={lang}
          />

          <section className="panel science-section">
            <div className="panel-header">
              <div>
                <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FlaskConical size={18} color="#f97316" />
                  {t.modalTitle}
                </h2>
                <p className="panel-subtitle" style={{ maxWidth: '75ch', marginTop: '6px' }}>
                  {t.modalIntro}
                </p>
              </div>
            </div>

            <div className="science-panel-grid">
              <div className="sensor-compare-grid" style={{ margin: 0 }}>
                <div className="sensor-box">
                  <span className="badge badge-elevated">MODIS (Terra / Aqua)</span>
                  <div className="pixel-demo">
                    <div className="pixel-modis">1.0 km → 2.6 km (Scan × Track)</div>
                  </div>
                  <p className="sensor-desc">{t.modalModisDesc}</p>
                </div>

                <div className="sensor-box">
                  <span className="badge badge-critical">VIIRS (Suomi NPP / NOAA-20 / 21)</span>
                  <div className="pixel-demo">
                    <div className="pixel-viirs-grid">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span key={i} className="pixel-viirs-cell" />
                      ))}
                    </div>
                  </div>
                  <p className="sensor-desc">{t.modalViirsDesc}</p>
                </div>
              </div>

              <div className="formula-box">
                <strong>{t.modalFormulaTitle}</strong>
                <code>
                  VIIRS_effective = Coincident_VIIRS + (VIIRS_only_small × {viirsOnlyWeight})
                </code>
                <code>VIIRS_normalized = VIIRS_effective × {calibrationFactor}</code>
                <code>Harmonized_Index = (MODIS_raw + VIIRS_normalized) / 2</code>
                <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#9ca3af', lineHeight: 1.55 }}>
                  {t.modalFormulaNote(calibrationFactor)}
                </p>
              </div>
            </div>

            <div className="science-arch-block">
              <h3 className="science-arch-title">{t.modalPillarsTitle}</h3>
              <div className="pillars-grid">
                {t.modalPillars.map((pillar) => (
                  <div key={pillar.title} className="pillar-card">
                    <strong>{pillar.title}</strong>
                    <p>{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      <PitchModeModal
        open={pitchOpen}
        onClose={() => setPitchOpen(false)}
        regionName={activeRegion.name}
        totalFires={firesData?.total_count ?? 0}
        calibrationFactor={calibrationFactor}
        summary={summary}
        mapMode={mapMode}
        chartMode={chartMode}
        lang={lang}
        onSelectView={setActiveView}
        onTriggerDemoAction={(action) => {
          if (action === 'raw' || action === 'harmonized' || action === 'coincidence' || action === 'frp') {
            setChartMode(action);
          } else if (action === 'grid' || action === 'points' || action === 'footprints') {
            setMapMode(action);
          }
        }}
      />

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          type="button"
          className={`mobile-nav-item ${activeView === 'overview' && !pitchOpen ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <LayoutGrid size={18} />
          <span>{t.navPanel}</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${activeView === 'matrix' && !pitchOpen ? 'active' : ''}`}
          onClick={() => setActiveView('matrix')}
        >
          <Calendar size={18} />
          <span>{t.navCalendar}</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${activeView === 'science' && !pitchOpen ? 'active' : ''}`}
          onClick={() => setActiveView('science')}
        >
          <FlaskConical size={18} />
          <span>{t.navScience}</span>
        </button>
        <button
          type="button"
          className={`mobile-nav-item ${pitchOpen ? 'active' : ''}`}
          onClick={() => {
            setActiveView('overview');
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
