import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Grid3X3,
  Layers,
  Presentation,
  Radio,
  TrendingUp,
  X,
} from 'lucide-react';
import type { TimelineSummary } from '../types';

interface PitchModeModalProps {
  open: boolean;
  onClose: () => void;
  regionName: string;
  totalFires: number;
  calibrationFactor: number;
  summary?: TimelineSummary;
  onTriggerDemoAction: (action: 'raw' | 'harmonized' | 'grid') => void;
}

const TOTAL_SLIDES = 5;

export function PitchModeModal({
  open,
  onClose,
  regionName,
  totalFires,
  calibrationFactor,
  summary,
  onTriggerDemoAction,
}: PitchModeModalProps) {
  const [slideIndex, setSlideIndex] = useState<number>(0);

  useEffect(() => {
    if (!open) return;
    setSlideIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setSlideIndex((prev) => Math.min(TOTAL_SLIDES - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setSlideIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const ytdHarmonized = summary?.ytd_harmonized ?? 100;
  const ytdHistorical = summary?.ytd_historical ?? 100;
  const projected60d = Math.round(ytdHarmonized * 0.24 * 10) / 10;
  const baseline60d = Math.round(ytdHistorical * 0.20 * 10) / 10;
  const ytdDev = summary?.ytd_deviation_pct ?? 0;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="pitch-title">
      <div className="modal-card pitch-modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Presentation size={20} color="#f97316" />
            <h2 id="pitch-title" style={{ margin: 0, fontSize: '1.05rem' }}>
              Modo Pitch — NASA Space Apps ({slideIndex + 1}/{TOTAL_SLIDES})
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar Modo Pitch">
            <X size={18} />
          </button>
        </div>

        <div className="pitch-slide-body">
          {slideIndex === 0 && (
            <div>
              <span className="badge badge-critical" style={{ marginBottom: '12px' }}>
                <Flame size={13} /> Slide 1 — O Desafio na Amazônia (Manaus)
              </span>
              <h3 className="pitch-slide-heading">
                Amazon Fire Calendar: Inteligência Orbital para a Amazônia
              </h3>
              <p className="pitch-lead">
                Monitorar queimadas na Amazônia Legal e ao redor de Manaus exige unir{' '}
                <strong>mais de 20 anos de histórico</strong> com detecções orbitais modernas de alta
                resolução — guiando equipes de emergência <em>antes</em> do pico da estação seca em
                agosto e setembro.
              </p>
              <div className="pitch-kpi-row">
                <div className="pitch-mini-card">
                  <span className="kpi-label">Foco Inicial</span>
                  <strong>Amazônia & Manaus</strong>
                  <p>Estudo de caso real com dados abertos da NASA FIRMS</p>
                </div>
                <div className="pitch-mini-card">
                  <span className="kpi-label">Objetivo</span>
                  <strong>Alerta Precoce</strong>
                  <p>Antecipar mobilização de brigadistas sem falsos alarmes</p>
                </div>
              </div>
            </div>
          )}

          {slideIndex === 1 && (
            <div>
              <span className="badge badge-elevated" style={{ marginBottom: '12px' }}>
                Slide 2 — O Paradoxo dos Sensores da NASA
              </span>
              <h3 className="pitch-slide-heading">
                MODIS (1 km) vs. VIIRS (375 m): câmeras diferentes, números incompatíveis
              </h3>
              <div className="sensor-compare-grid">
                <div className="sensor-box">
                  <span className="badge badge-elevated">MODIS (Terra / Aqua)</span>
                  <div className="pixel-demo">
                    <div className="pixel-modis">1 km × 1 km = 1,00 km²</div>
                  </div>
                  <p className="sensor-desc">
                    Base histórica de 20+ anos, porém resolução menor. Um incêndio médio conta como{' '}
                    <strong>1 foco</strong>.
                  </p>
                </div>
                <div className="sensor-box">
                  <span className="badge badge-critical">VIIRS (S-NPP / NOAA-20)</span>
                  <div className="pixel-demo">
                    <div className="pixel-viirs-grid">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span key={i} className="pixel-viirs-cell" />
                      ))}
                    </div>
                  </div>
                  <p className="sensor-desc">
                    <strong>375 m × 375 m = 0,14 km²</strong> (~7× mais detalhado em área). O mesmo fogo
                    vira <strong>~4× mais focos</strong>!
                  </p>
                </div>
              </div>
              <div className="pitch-action-row">
                <button
                  type="button"
                  className="control-select action-btn pitch-btn"
                  onClick={() => onTriggerDemoAction('raw')}
                >
                  <Layers size={15} />
                  Ver Distorção nos Dados Brutos
                </button>
              </div>
            </div>
          )}

          {slideIndex === 2 && (
            <div>
              <span className="badge badge-live" style={{ marginBottom: '12px' }}>
                Slide 3 — Nossa Solução: Harmonização Espaço-Temporal
              </span>
              <h3 className="pitch-slide-heading">
                Agregação por Região + Tempo na mesma régua histórica
              </h3>
              <p className="pitch-lead">
                Em vez de tentar cruzar ponto a ponto, agrupamos os focos em{' '}
                <strong>quadrantes geográficos (Grid Espacial)</strong> e janelas temporais, calibrando
                o VIIRS para a escala histórica do MODIS:
              </p>
              <div className="formula-box" style={{ marginBottom: '14px' }}>
                <code>VIIRS_normalizado = VIIRS_bruto × {calibrationFactor}</code>
                <code>Índice_Harmonizado = (MODIS_bruto + VIIRS_normalizado) / 2</code>
              </div>
              <div className="pitch-action-row">
                <button
                  type="button"
                  className="control-select action-btn pitch-btn"
                  onClick={() => onTriggerDemoAction('harmonized')}
                >
                  <Layers size={15} />
                  Ver Gráfico Harmonizado
                </button>
                <button
                  type="button"
                  className="control-select action-btn"
                  onClick={() => onTriggerDemoAction('grid')}
                >
                  <Grid3X3 size={15} />
                  Abrir Grid Espacial no Mapa
                </button>
              </div>
            </div>
          )}

          {slideIndex === 3 && (
            <div>
              <span className="badge badge-critical" style={{ marginBottom: '12px' }}>
                <TrendingUp size={13} /> Slide 4 — Diagnóstico Ao Vivo & Projeção de 60 Dias
              </span>
              <h3 className="pitch-slide-heading">Panorama Atual: {regionName}</h3>
              <div className="pitch-kpi-row">
                <div className="pitch-mini-card">
                  <span className="kpi-label">Focos Recentes (NASA FIRMS)</span>
                  <strong>{totalFires.toLocaleString('pt-BR')}</strong>
                  <p>Detecções MODIS + VIIRS na região selecionada</p>
                </div>
                <div className="pitch-mini-card">
                  <span className="kpi-label">Desvio Acumulado (YTD)</span>
                  <strong>
                    {ytdDev >= 0 ? '+' : ''}
                    {ytdDev}% ({summary?.early_warning_status ?? 'normal'})
                  </strong>
                  <p>Pico registrado em {summary?.peak_period ?? '—'}</p>
                </div>
                <div className="pitch-mini-card">
                  <span className="kpi-label">Projeção Próximos 60 Dias</span>
                  <strong>
                    {projected60d} vs. {baseline60d} (base)
                  </strong>
                  <p>Estimativa se o ritmo harmonizado atual continuar</p>
                </div>
              </div>
              {summary?.recommendation && (
                <div className="formula-box" style={{ marginTop: '12px' }}>
                  <strong>Recomendação Operacional:</strong>
                  <span style={{ fontSize: '0.88rem', color: '#e5e7eb' }}>
                    {summary.recommendation}
                  </span>
                </div>
              )}
            </div>
          )}

          {slideIndex === 4 && (
            <div>
              <span className="badge badge-live" style={{ marginBottom: '12px' }}>
                <Radio size={13} /> Slide 5 — Arquitetura & Equipe
              </span>
              <h3 className="pitch-slide-heading">Pronto para Escalar em Qualquer Bioma</h3>
              <div className="pitch-kpi-row">
                <div className="pitch-mini-card">
                  <span className="kpi-label">Dados da NASA</span>
                  <strong>NASA FIRMS API</strong>
                  <p>MODIS C6.1 & VIIRS 375m NRT + fallback CSV resiliente</p>
                </div>
                <div className="pitch-mini-card">
                  <span className="kpi-label">Backend & Ciência</span>
                  <strong>Python + FastAPI</strong>
                  <p>Motor de calibração, grid espacial e pronto para Cloud Run</p>
                </div>
                <div className="pitch-mini-card">
                  <span className="kpi-label">Frontend & Visual</span>
                  <strong>React + TypeScript</strong>
                  <p>Leaflet Spatial Grid, Recharts e deploy Firebase Hosting</p>
                </div>
              </div>
              <div className="formula-box" style={{ marginTop: '14px' }}>
                <strong>Equipe Manaus — NASA Space Apps Hackathon</strong>
                <span style={{ fontSize: '0.88rem', color: '#d1d5db' }}>
                  Você, Rickelmy, Raphael, Iago e time — transformando dados orbitais abertos em ação
                  preventiva na floresta amazônica.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pitch-footer">
          <button
            type="button"
            className="control-select action-btn"
            onClick={() => setSlideIndex((prev) => Math.max(0, prev - 1))}
            disabled={slideIndex === 0}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <div className="pitch-dots" role="tablist" aria-label="Slides do pitch">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`pitch-dot ${idx === slideIndex ? 'active' : ''}`}
                onClick={() => setSlideIndex(idx)}
                aria-label={`Ir para slide ${idx + 1}`}
              />
            ))}
          </div>

          {slideIndex < TOTAL_SLIDES - 1 ? (
            <button
              type="button"
              className="control-select action-btn pitch-btn"
              onClick={() => setSlideIndex((prev) => Math.min(TOTAL_SLIDES - 1, prev + 1))}
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="control-select action-btn" onClick={onClose}>
              Concluir Pitch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
