import { FlaskConical, X } from 'lucide-react';
import { I18N, type Language } from '../i18n';

interface MethodologyModalProps {
  open: boolean;
  onClose: () => void;
  calibrationFactor: number;
  viirsOnlyWeight?: number;
  lang: Language;
}

export function MethodologyModal({
  open,
  onClose,
  calibrationFactor,
  viirsOnlyWeight = 0.85,
  lang,
}: MethodologyModalProps) {
  if (!open) return null;
  const t = I18N[lang];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="methodology-title">
      <div className="modal-card" style={{ maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto' }}>
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

          <div style={{ margin: '14px 0' }}>
            <strong style={{ display: 'block', marginBottom: '8px', color: '#f9fafb' }}>
              {t.modalPillarsTitle}
            </strong>
            <div className="pillars-grid">
              {t.modalPillars.map((p, idx) => (
                <div key={idx} className="pillar-card">
                  <strong>{p.title}</strong>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="formula-box">
            <strong>{t.modalFormulaTitle}</strong>
            <code>
              VIIRS_effective = Coincident_VIIRS + (VIIRS_only_small × {viirsOnlyWeight})
            </code>
            <code>VIIRS_normalized = VIIRS_effective × {calibrationFactor}</code>
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
