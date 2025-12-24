import React from "react";

const ColorRow = ({ label, value, onChange, help }) => (
  <div className="tema-item">
    <span className="tema-label">{label}</span>

    <div className="tema-color-row">
      <span className="tema-color-preview" style={{ backgroundColor: value }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="tema-hex">{value}</span>
    </div>

    {help ? <p className="tema-help">{help}</p> : null}
  </div>
);

export default function TemaTpvPanel({ temaTpv, setTemaTpv }) {
  const setField = (key, val) =>
    setTemaTpv((prev) => ({
      ...prev,
      [key]: val,
    }));

  return (
    <section className="config-card card config-card--tema">
      <header className="config-card-header">
        <h2>🖥️ Apariencia del TPV</h2>
        <p className="config-card-subtitle">
          Personaliza los tokens del tema del TPV (bg, surfaces, botones, texto, etc.).
        </p>
      </header>

      <div className="tema-grid">
        <ColorRow
          label="Fondo (bg)"
          value={temaTpv.bg}
          onChange={(v) => setField("bg", v)}
          help="Fondo general de la app."
        />

        <ColorRow
          label="Surface (panel base)"
          value={temaTpv.surface}
          onChange={(v) => setField("surface", v)}
          help="Fondos de paneles / cards base."
        />

        <ColorRow
          label="Surface 2 (card interna)"
          value={temaTpv.surface2}
          onChange={(v) => setField("surface2", v)}
          help="Tarjeta sobre tarjeta, inputs, cajas internas."
        />

        <ColorRow
          label="Texto"
          value={temaTpv.text}
          onChange={(v) => setField("text", v)}
        />

        <ColorRow
          label="Borde"
          value={temaTpv.border}
          onChange={(v) => setField("border", v)}
        />

        <ColorRow
          label="Primary"
          value={temaTpv.primary}
          onChange={(v) => setField("primary", v)}
          help="Acento principal (títulos, estados, etc.)"
        />

        <ColorRow
          label="Primary hover"
          value={temaTpv.primaryHover}
          onChange={(v) => setField("primaryHover", v)}
        />

        <ColorRow
          label="Secondary (botones)"
          value={temaTpv.secondary}
          onChange={(v) => setField("secondary", v)}
          help="Botones principales del TPV."
        />

        <ColorRow
          label="Secondary hover"
          value={temaTpv.secondaryHover}
          onChange={(v) => setField("secondaryHover", v)}
        />

        <ColorRow label="Success" value={temaTpv.success} onChange={(v) => setField("success", v)} />
        <ColorRow label="Warning" value={temaTpv.warning} onChange={(v) => setField("warning", v)} />
        <ColorRow label="Danger" value={temaTpv.danger} onChange={(v) => setField("danger", v)} />
        <ColorRow label="Info" value={temaTpv.info} onChange={(v) => setField("info", v)} />
      </div>

      {/* Preview rápida */}
      <div className="tpv-preview" style={{ backgroundColor: temaTpv.bg }}>
        <aside className="tpv-preview-sidebar" style={{ backgroundColor: temaTpv.primary }}>
          TPV
        </aside>

        <div className="tpv-preview-main">
          <div
            className="tpv-preview-card"
            style={{
              backgroundColor: temaTpv.surface2,
              borderColor: temaTpv.border,
              color: temaTpv.text,
            }}
          >
            <div className="tpv-preview-card-title">Mesa 3</div>
            <div className="tpv-preview-card-body">
              <span>12,00 €</span>
              <button className="tpv-preview-btn" style={{ backgroundColor: temaTpv.secondary }}>
                Cobrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
