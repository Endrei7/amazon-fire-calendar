import { FlaskConical, X } from 'lucide-react';

interface MethodologyModalProps {
  open: boolean;
  onClose: () => void;
  calibrationFactor: number;
}

export function MethodologyModal({ open, onClose, calibrationFactor }: MethodologyModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="methodology-title">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FlaskConical size={20} color="#f97316" />
            <h2 id="methodology-title" style={{ margin: 0, fontSize: '1.1rem' }}>
              Metodologia Científica: MODIS (1km) vs. VIIRS (375m)
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p>
            O desafio central do <strong>NASA Space Apps</strong> é evitar comparações distorcidas entre
            gerações diferentes de sensores orbitais sem perder os mais de 20 anos de série histórica do MODIS.
          </p>

          <div className="sensor-compare-grid">
            <div className="sensor-box">
              <span className="badge badge-elevated">MODIS (Terra / Aqua)</span>
              <div className="pixel-demo">
                <div className="pixel-modis">1 km × 1 km (1,00 km²)</div>
              </div>
              <p className="sensor-desc">
                Pixel maior: um incêndio de médio porte costuma aparecer como <strong>1 único foco</strong>.
                Série histórica de referência desde o ano 2000.
              </p>
            </div>

            <div className="sensor-box">
              <span className="badge badge-critical">VIIRS (Suomi NPP / NOAA-20)</span>
              <div className="pixel-demo">
                <div className="pixel-viirs-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="pixel-viirs-cell" />
                  ))}
                </div>
              </div>
              <p className="sensor-desc">
                Pixel de <strong>375 m × 375 m (0,14 km²)</strong> — cerca de 7× menor em área. O mesmo
                incêndio é fragmentado em <strong>4 a 7 focos</strong> distintos.
              </p>
            </div>
          </div>

          <div className="formula-box">
            <strong>Fórmula de Harmonização Aplicada no Backend:</strong>
            <code>VIIRS_normalizado = VIIRS_bruto × {calibrationFactor}</code>
            <code>Índice_Harmonizado = (MODIS_bruto + VIIRS_normalizado) / 2</code>
            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
              O fator de calibração (<code>× {calibrationFactor}</code>) é estimado a partir dos períodos de
              sobreposição em que ambos os satélites observaram a mesma região, garantindo que a curva atual
              possa ser comparada diretamente à média histórica MODIS sem falsos alarmes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
