import { FlaskConical, X } from 'lucide-react';
import { I18N, type Language } from '../i18n';

interface MethodologyModalProps {
  open: boolean;
  onClose: () => void;
  calibrationFactor: number;
  lang: Language;
}

export function MethodologyModal({ open, onClose, calibrationFactor, lang }: MethodologyModalProps) {
  if (!open) return null;
  const t = I18N[lang];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="methodology-title">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FlaskConical size={20} color="#f97316" />
            <h2 id="methodology-title" style={{ margin: 0, fontSize: '1.1rem' }}>
              {t.modalTitle}
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p>{t.modalIntro}</p>

          <div className="sensor-compare-grid">
            <div className="sensor-box">
              <span className="badge badge-elevated">MODIS (Terra / Aqua)</span>
              <div className="pixel-demo">
                <div className="pixel-modis">1 km × 1 km (1.00 km²)</div>
              </div>
              <p className="sensor-desc">{t.modalModisDesc}</p>
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
              <p className="sensor-desc">{t.modalViirsDesc}</p>
            </div>
          </div>

          <div className="formula-box">
            <strong>{t.modalFormulaTitle}</strong>
            <code>VIIRS_normalized = VIIRS_raw × {calibrationFactor}</code>
            <code>Harmonized_Index = (MODIS_raw + VIIRS_normalized) / 2</code>
            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
              {t.modalFormulaNote(calibrationFactor)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
