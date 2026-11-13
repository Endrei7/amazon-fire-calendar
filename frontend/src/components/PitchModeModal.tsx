import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Layers,
  MapPin,
  Presentation,
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
  mapMode: 'points' | 'grid';
  showRawComparison: boolean;
  onTriggerDemoAction: (action: 'raw' | 'harmonized' | 'grid' | 'points') => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
}

interface TourStep {
  target: string;
  badge: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'topbar',
    badge: 'Passo 1 de 5 — Controles & Dados NASA',
    title: 'Contexto & Fonte Ao Vivo (Amazônia / Manaus)',
    description:
      'Aqui selecionamos a região da Amazônia (com foco inicial em Manaus e Amazonas), filtramos os satélites MODIS (1 km) e VIIRS (375 m) da NASA FIRMS e acessamos metodologia e exportação CSV.',
  },
  {
    target: 'kpi-grid',
    badge: 'Passo 2 de 5 — Calibração Orbital',
    title: 'Calibração em Tempo Real',
    description:
      'Estes cartões resumem o total de focos recebidos da NASA, o fator matemático que converte VIIRS para a escala MODIS, o desvio do último período e o status da conexão ao vivo.',
  },
  {
    target: 'map-panel',
    badge: 'Passo 3 de 5 — Mapa Espacial',
    title: 'Pontos Individuais vs. Grid Harmonizado',
    description:
      'Em vez de tentar cruzar foco a foco, agrupamos os dois sensores em quadrantes geográficos (Grid Espacial). Alterne abaixo ao vivo para mostrar aos jurados onde estão as áreas críticas.',
  },
  {
    target: 'chart-panel',
    badge: 'Passo 4 de 5 — Calendário Comparativo',
    title: 'O Paradoxo MODIS (1 km) vs. VIIRS (375 m)',
    description:
      'Nos dados brutos, o VIIRS parece 4× maior só porque sua câmera é mais nítida. No modo harmonizado, ambos entram na mesma régua da média histórica MODIS — evitando falsos alarmes.',
  },
  {
    target: 'calendar-matrix',
    badge: 'Passo 5 de 5 — Alerta Precoce',
    title: 'Diagnóstico Anual & Projeção de 60 Dias',
    description:
      'A matriz mensal e a projeção de 60 dias mostram exatamente quando a curva foge do padrão histórico, orientando brigadistas e Defesa Civil antes do pico de agosto–setembro.',
  },
];

export function PitchModeModal({
  open,
  onClose,
  regionName,
  totalFires,
  calibrationFactor,
  summary,
  mapMode,
  showRawComparison,
  onTriggerDemoAction,
}: PitchModeModalProps) {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const measureTarget = useCallback((index: number) => {
    const step = TOUR_STEPS[index];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      bottom: r.bottom,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const step = TOUR_STEPS[stepIndex];
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    measureTarget(stepIndex);
    const timer1 = window.setTimeout(() => measureTarget(stepIndex), 220);
    const timer2 = window.setTimeout(() => measureTarget(stepIndex), 450);

    const handleReposition = () => measureTarget(stepIndex);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, stepIndex, measureTarget]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setStepIndex((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const step = TOUR_STEPS[stepIndex];
  const ytdDev = summary?.ytd_deviation_pct ?? 0;

  const getTooltipStyle = (): CSSProperties => {
    if (!rect || typeof window === 'undefined') {
      return { bottom: '24px', right: '24px' };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(460, vw - 32);

    // Tall sections (map/chart/calendar): dock cleanly in opposite corner or bottom-right
    if (rect.height > vh * 0.45) {
      const dockLeft = rect.left > vw * 0.35;
      return {
        bottom: '20px',
        left: dockLeft ? '20px' : undefined,
        right: dockLeft ? undefined : '20px',
      };
    }

    const clampedLeft = Math.max(16, Math.min(rect.left, vw - cardWidth - 16));
    if (rect.bottom + 260 < vh) {
      return {
        top: `${Math.max(16, rect.bottom + 16)}px`,
        left: `${clampedLeft}px`,
      };
    }

    if (rect.top > 260) {
      return {
        bottom: `${Math.max(16, vh - rect.top + 16)}px`,
        left: `${clampedLeft}px`,
      };
    }

    return { bottom: '20px', right: '20px' };
  };

  return (
    <>
      {rect && (
        <div
          className="tour-spotlight-box"
          style={{
            top: `${Math.max(4, rect.top - 8)}px`,
            left: `${Math.max(4, rect.left - 8)}px`,
            width: `${rect.width + 16}px`,
            height: `${rect.height + 16}px`,
          }}
        />
      )}

      <div
        className="tour-tooltip-card"
        style={getTooltipStyle()}
        role="dialog"
        aria-modal="false"
        aria-labelledby="pitch-tour-title"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Presentation size={18} color="#f97316" />
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fdba74' }}>
              {step.badge}
            </span>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar tour">
            <X size={16} />
          </button>
        </div>

        <div className="tour-tooltip-body">
          <h3 id="pitch-tour-title">{step.title}</h3>
          <p>{step.description}</p>

          {stepIndex === 1 && (
            <div className="tour-live-note">
              <strong>{regionName}:</strong> {totalFires.toLocaleString('pt-BR')} focos recentes •
              Fator de calibração <code>× {calibrationFactor}</code>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="pitch-action-row">
              <button
                type="button"
                className={`control-select action-btn ${mapMode === 'points' ? 'pitch-btn' : ''}`}
                onClick={() => onTriggerDemoAction('points')}
              >
                <MapPin size={14} />
                Ver Pontos (Satélite)
              </button>
              <button
                type="button"
                className={`control-select action-btn ${mapMode === 'grid' ? 'pitch-btn' : ''}`}
                onClick={() => onTriggerDemoAction('grid')}
              >
                <Grid3X3 size={14} />
                Ver Grid Harmonizado
              </button>
            </div>
          )}

          {stepIndex === 3 && (
            <div className="pitch-action-row">
              <button
                type="button"
                className={`control-select action-btn ${showRawComparison ? 'pitch-btn' : ''}`}
                onClick={() => onTriggerDemoAction('raw')}
              >
                <Layers size={14} />
                Ver Distorção (Brutos)
              </button>
              <button
                type="button"
                className={`control-select action-btn ${!showRawComparison ? 'pitch-btn' : ''}`}
                onClick={() => onTriggerDemoAction('harmonized')}
              >
                <Layers size={14} />
                Ver Série Harmonizada
              </button>
            </div>
          )}

          {stepIndex === 4 && (
            <div className="tour-live-note">
              <strong>Status ({regionName}):</strong> desvio acumulado de{' '}
              {ytdDev >= 0 ? '+' : ''}
              {ytdDev}% • Pico em {summary?.peak_period ?? '—'}
            </div>
          )}
        </div>

        <div className="pitch-footer">
          <button
            type="button"
            className="control-select action-btn"
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={stepIndex === 0}
          >
            <ChevronLeft size={15} />
            Anterior
          </button>

          <div className="pitch-dots" role="tablist" aria-label="Passos do tour">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`pitch-dot ${idx === stepIndex ? 'active' : ''}`}
                onClick={() => setStepIndex(idx)}
                aria-label={`Ir para passo ${idx + 1}`}
              />
            ))}
          </div>

          {stepIndex < TOUR_STEPS.length - 1 ? (
            <button
              type="button"
              className="control-select action-btn pitch-btn"
              onClick={() => setStepIndex((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1))}
            >
              Próximo
              <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" className="control-select action-btn pitch-btn" onClick={onClose}>
              Finalizar Tour
            </button>
          )}
        </div>
      </div>
    </>
  );
}
