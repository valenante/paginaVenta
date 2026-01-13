import React from "react";

/* =====================================================
   🎨 FILA DE COLOR
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
   🛒 PANEL DE APARIENCIA SHOP
===================================================== */
export default function TemaShopPanel({ temaShop, setTemaShop }) {
  const setField = (key, val) =>
    setTemaShop((prev) => ({
      ...prev,
      [key]: val,
    }));

  return (
    <section className="config-card card config-card--tema">
      <header className="config-card-header">
        <h2>🛒 Apariencia de la tienda</h2>
        <p className="config-card-subtitle">
          Personaliza los colores del panel de tienda y del backoffice.
        </p>
      </header>

      {/* ===========================
          COLORES BASE
      =========================== */}
      <div className="tema-grid">
        <ColorRow
          label="Color de fondo"
          value={temaShop.bg}
          onChange={(v) => setField("bg", v)}
        />

        <ColorRow
          label="Superficie principal"
          value={temaShop.surface}
          onChange={(v) => setField("surface", v)}
        />

        <ColorRow
          label="Superficie secundaria"
          value={temaShop.surface2}
          onChange={(v) => setField("surface2", v)}
        />

        <ColorRow
          label="Color del texto"
          value={temaShop.text}
          onChange={(v) => setField("text", v)}
        />

        <ColorRow
          label="Color de bordes"
          value={temaShop.border}
          onChange={(v) => setField("border", v)}
        />

        {/* ===========================
            COLORES DE ACCIÓN
        =========================== */}
        <ColorRow
          label="Color principal (botones)"
          value={temaShop.primary}
          onChange={(v) => setField("primary", v)}
        />

        <ColorRow
          label="Color principal (hover)"
          value={temaShop.primaryHover}
          onChange={(v) => setField("primaryHover", v)}
        />

        {/* ===========================
            COLORES DE ESTADO
        =========================== */}
        <ColorRow
          label="Estado correcto / positivo"
          value={temaShop.success}
          onChange={(v) => setField("success", v)}
          help="Se usa para acciones correctas, confirmaciones o estados positivos."
        />

        <ColorRow
          label="Avisos / atención"
          value={temaShop.warning}
          onChange={(v) => setField("warning", v)}
          help="Se usa para avisos importantes que requieren atención."
        />

        <ColorRow
          label="Errores / acciones peligrosas"
          value={temaShop.danger}
          onChange={(v) => setField("danger", v)}
          help="Se usa para errores, eliminaciones o acciones críticas."
        />

        <ColorRow
          label="Información"
          value={temaShop.info}
          onChange={(v) => setField("info", v)}
          help="Se usa para mensajes informativos o neutros."
        />
      </div>

      {/* ===========================
          PREVISUALIZACIÓN
      =========================== */}
      <div
        className="shop-preview"
        style={{ backgroundColor: temaShop.bg }}
      >
        <div
          className="shop-preview-card"
          style={{
            backgroundColor: temaShop.surface,
            color: temaShop.text,
            borderColor: temaShop.border,
          }}
        >
          <h4 style={{ color: temaShop.primary }}>
            Producto de ejemplo
          </h4>

          <p>Descripción del producto</p>

          <button
            style={{
              backgroundColor: temaShop.primary,
              color: "#fff",
            }}
          >
            Comprar
          </button>
        </div>
      </div>
    </section>
  );
}
