import React from "react";

/* =====================================================
   🎨 FILA DE COLOR (REUTILIZABLE)
===================================================== */
const ColorRow = ({ label, value, onChange, help }) => (
  <div className="tema-item">
    <span className="tema-label">{label}</span>

    <div className="tema-color-row">
      <span
        className="tema-color-preview"
        style={{ backgroundColor: value }}
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="tema-hex">{value}</span>
    </div>

    {help && <p className="tema-help">{help}</p>}
  </div>
);

/* =====================================================
   🖥️ PANEL DE APARIENCIA TPV
===================================================== */
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
          Personaliza los colores del TPV: fondo, paneles, botones, textos y
          estados visuales.
        </p>
      </header>

      <div className="tema-grid">
        {/* ===========================
            COLORES BASE
        =========================== */}
        <ColorRow
          label="Fondo general"
          value={temaTpv.bg}
          onChange={(v) => setField("bg", v)}
          help="Color de fondo principal de toda la aplicación."
        />

        <ColorRow
          label="Panel principal"
          value={temaTpv.surface}
          onChange={(v) => setField("surface", v)}
          help="Fondos de paneles y secciones principales."
        />

        <ColorRow
          label="Panel secundario"
          value={temaTpv.surface2}
          onChange={(v) => setField("surface2", v)}
          help="Tarjetas internas, listas e inputs."
        />

        <ColorRow
          label="Color del texto"
          value={temaTpv.text}
          onChange={(v) => setField("text", v)}
        />

        <ColorRow
          label="Color de bordes"
          value={temaTpv.border}
          onChange={(v) => setField("border", v)}
        />

        {/* ===========================
            COLORES DE ACCIÓN
        =========================== */}
        <ColorRow
          label="Color principal"
          value={temaTpv.primary}
          onChange={(v) => setField("primary", v)}
          help="Acento visual del TPV (barra lateral, títulos, elementos destacados)."
        />

        <ColorRow
          label="Color principal (hover)"
          value={temaTpv.primaryHover}
          onChange={(v) => setField("primaryHover", v)}
        />

        <ColorRow
          label="Botones principales"
          value={temaTpv.secondary}
          onChange={(v) => setField("secondary", v)}
          help="Botones de acción como cobrar, confirmar, guardar, etc."
        />

        <ColorRow
          label="Botones principales (hover)"
          value={temaTpv.secondaryHover}
          onChange={(v) => setField("secondaryHover", v)}
        />

        {/* ===========================
            COLORES DE ESTADO
        =========================== */}
        <ColorRow
          label="Estado correcto / confirmado"
          value={temaTpv.success}
          onChange={(v) => setField("success", v)}
          help="Acciones correctas, estados completados o confirmaciones."
        />

        <ColorRow
          label="Avisos / atención"
          value={temaTpv.warning}
          onChange={(v) => setField("warning", v)}
          help="Avisos importantes que requieren atención del usuario."
        />

        <ColorRow
          label="Errores / acciones críticas"
          value={temaTpv.danger}
          onChange={(v) => setField("danger", v)}
          help="Errores, cancelaciones, eliminaciones o acciones peligrosas."
        />

        <ColorRow
          label="Información"
          value={temaTpv.info}
          onChange={(v) => setField("info", v)}
          help="Mensajes informativos o neutros."
        />
      </div>

      {/* ===========================
          PREVISUALIZACIÓN RÁPIDA
      =========================== */}
      <div
        className="tpv-preview"
        style={{ backgroundColor: temaTpv.bg }}
      >
        <aside
          className="tpv-preview-sidebar"
          style={{ backgroundColor: temaTpv.primary }}
        >
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

              <button
                className="tpv-preview-btn"
                style={{ backgroundColor: temaTpv.secondary }}
              >
                Cobrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
