import React, { useCallback } from "react";

/* =====================================================
   PRESETS
===================================================== */
const PRESETS = [
  {
    id: "rojo-oscuro",
    nombre: "Rojo oscuro",
    colores: {
      bg: "#5B1010", surface: "#2b2b2b", surface2: "#3a3a3a",
      text: "#ffffff", border: "rgba(255,255,255,0.12)",
      primary: "#9B1C1C", primaryHover: "#7E1616",
      secondary: "#4465e7", secondaryHover: "#3C4C8A",
      success: "#22c55e", warning: "#f59e0b", danger: "#dc2626", info: "#0ea5e9",
      solicitado: "#e65100", productoListo: "#16a34a",
      mesaCerradaBg: "#1a1a1a", mesaCerradaBorder: "#333333",
      mesaAbiertaBg: "#283593", mesaAbiertaBorder: "#3949ab",
      mesaMiaBg: "#1b5e20", mesaMiaBorder: "#2e7d32",
    },
  },
  {
    id: "azul-oscuro",
    nombre: "Azul oscuro",
    colores: {
      bg: "#0f172a", surface: "#1e293b", surface2: "#334155",
      text: "#f1f5f9", border: "rgba(255,255,255,0.10)",
      primary: "#2563eb", primaryHover: "#1d4ed8",
      secondary: "#8b5cf6", secondaryHover: "#7c3aed",
      success: "#22c55e", warning: "#f59e0b", danger: "#ef4444", info: "#06b6d4",
      solicitado: "#7c3aed", productoListo: "#22c55e",
      mesaCerradaBg: "#0f172a", mesaCerradaBorder: "#1e293b",
      mesaAbiertaBg: "#1e3a5f", mesaAbiertaBorder: "#2563eb",
      mesaMiaBg: "#14532d", mesaMiaBorder: "#22c55e",
    },
  },
  {
    id: "verde-oscuro",
    nombre: "Verde oscuro",
    colores: {
      bg: "#0c1a0e", surface: "#1a2e1c", surface2: "#2d4a30",
      text: "#f0fdf4", border: "rgba(255,255,255,0.10)",
      primary: "#16a34a", primaryHover: "#15803d",
      secondary: "#ea580c", secondaryHover: "#c2410c",
      success: "#4ade80", warning: "#fbbf24", danger: "#f87171", info: "#38bdf8",
      solicitado: "#ea580c", productoListo: "#4ade80",
      mesaCerradaBg: "#0c1a0e", mesaCerradaBorder: "#1a2e1c",
      mesaAbiertaBg: "#1a4025", mesaAbiertaBorder: "#16a34a",
      mesaMiaBg: "#713f12", mesaMiaBorder: "#ea580c",
    },
  },
  {
    id: "gris-neutro",
    nombre: "Gris neutro",
    colores: {
      bg: "#18181b", surface: "#27272a", surface2: "#3f3f46",
      text: "#fafafa", border: "rgba(255,255,255,0.10)",
      primary: "#a855f7", primaryHover: "#9333ea",
      secondary: "#f97316", secondaryHover: "#ea580c",
      success: "#22c55e", warning: "#eab308", danger: "#ef4444", info: "#0ea5e9",
      solicitado: "#f97316", productoListo: "#22c55e",
      mesaCerradaBg: "#18181b", mesaCerradaBorder: "#27272a",
      mesaAbiertaBg: "#4c1d95", mesaAbiertaBorder: "#a855f7",
      mesaMiaBg: "#7c2d12", mesaMiaBorder: "#f97316",
    },
  },
];

/* =====================================================
   COLOR PICKER INLINE
===================================================== */
const ColorPick = ({ label, value, onChange }) => (
  <label className="tema-pick">
    <span className="tema-pick__swatch" style={{ backgroundColor: value }}>
      <input
        type="color"
        value={value?.startsWith?.("rgba") ? "#ffffff" : value}
        onChange={(e) => onChange(e.target.value)}
        className="tema-pick__input"
      />
    </span>
    <span className="tema-pick__label">{label}</span>
  </label>
);

/* =====================================================
   PANEL PRINCIPAL
===================================================== */
export default function TemaTpvPanel({ temaTpv, setTemaTpv }) {
  const set = useCallback(
    (key, val) => setTemaTpv((prev) => ({ ...prev, [key]: val })),
    [setTemaTpv]
  );

  const aplicarPreset = useCallback(
    (preset) => setTemaTpv((prev) => ({ ...prev, ...preset.colores })),
    [setTemaTpv]
  );

  return (
    <section className="config-card card config-card--tema">
      <header className="config-card-header">
        <h2>Apariencia del TPV</h2>
        <p className="config-card-subtitle">
          Elige un preset o personaliza cada color. La vista previa se actualiza
          en tiempo real.
        </p>
      </header>

      {/* ── PRESETS ── */}
      <div className="tema-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="tema-preset"
            onClick={() => aplicarPreset(p)}
          >
            <span className="tema-preset__colors">
              <span style={{ background: p.colores.bg }} />
              <span style={{ background: p.colores.primary }} />
              <span style={{ background: p.colores.secondary }} />
              <span style={{ background: p.colores.surface2 }} />
            </span>
            <span className="tema-preset__name">{p.nombre}</span>
          </button>
        ))}
      </div>

      {/* ── GRUPOS DE COLORES ── */}
      <div className="tema-groups">
        {/* Base */}
        <fieldset className="tema-group">
          <legend>Base</legend>
          <div className="tema-group__grid">
            <ColorPick label="Fondo" value={temaTpv.bg} onChange={(v) => set("bg", v)} />
            <ColorPick label="Panel" value={temaTpv.surface} onChange={(v) => set("surface", v)} />
            <ColorPick label="Panel 2" value={temaTpv.surface2} onChange={(v) => set("surface2", v)} />
            <ColorPick label="Texto" value={temaTpv.text} onChange={(v) => set("text", v)} />
            <ColorPick label="Bordes" value={temaTpv.border} onChange={(v) => set("border", v)} />
          </div>
        </fieldset>

        {/* Marca */}
        <fieldset className="tema-group">
          <legend>Marca</legend>
          <div className="tema-group__grid">
            <ColorPick label="Principal" value={temaTpv.primary} onChange={(v) => set("primary", v)} />
            <ColorPick label="Principal hover" value={temaTpv.primaryHover} onChange={(v) => set("primaryHover", v)} />
            <ColorPick label="Botones" value={temaTpv.secondary} onChange={(v) => set("secondary", v)} />
            <ColorPick label="Botones hover" value={temaTpv.secondaryHover} onChange={(v) => set("secondaryHover", v)} />
          </div>
        </fieldset>

        {/* Estados */}
        <fieldset className="tema-group">
          <legend>Estados</legend>
          <div className="tema-group__grid">
            <ColorPick label="Correcto" value={temaTpv.success} onChange={(v) => set("success", v)} />
            <ColorPick label="Aviso" value={temaTpv.warning} onChange={(v) => set("warning", v)} />
            <ColorPick label="Error" value={temaTpv.danger} onChange={(v) => set("danger", v)} />
            <ColorPick label="Info" value={temaTpv.info} onChange={(v) => set("info", v)} />
            <ColorPick label="Solicitado" value={temaTpv.solicitado} onChange={(v) => set("solicitado", v)} />
            <ColorPick label="Listo" value={temaTpv.productoListo} onChange={(v) => set("productoListo", v)} />
            <ColorPick label="Todo junto" value={temaTpv.todoJunto} onChange={(v) => set("todoJunto", v)} />
          </div>
        </fieldset>

        {/* Mesas */}
        <fieldset className="tema-group">
          <legend>Mesas</legend>
          <div className="tema-group__grid">
            <ColorPick label="Cerrada fondo" value={temaTpv.mesaCerradaBg} onChange={(v) => set("mesaCerradaBg", v)} />
            <ColorPick label="Cerrada borde" value={temaTpv.mesaCerradaBorder} onChange={(v) => set("mesaCerradaBorder", v)} />
            <ColorPick label="Abierta fondo" value={temaTpv.mesaAbiertaBg} onChange={(v) => set("mesaAbiertaBg", v)} />
            <ColorPick label="Abierta borde" value={temaTpv.mesaAbiertaBorder} onChange={(v) => set("mesaAbiertaBorder", v)} />
            <ColorPick label="Es mía fondo" value={temaTpv.mesaMiaBg} onChange={(v) => set("mesaMiaBg", v)} />
            <ColorPick label="Es mía borde" value={temaTpv.mesaMiaBorder} onChange={(v) => set("mesaMiaBorder", v)} />
          </div>
        </fieldset>
      </div>

      {/* ── PREVIEW ── */}
      <div className="tema-preview" style={{ backgroundColor: temaTpv.bg, color: temaTpv.text }}>
        {/* Sidebar */}
        <aside className="tema-preview__sidebar" style={{ backgroundColor: temaTpv.primary }}>
          <div className="tema-preview__logo">TPV</div>
          <div className="tema-preview__nav">
            <span className="tema-preview__nav-item active">Mesas</span>
            <span className="tema-preview__nav-item">Cocina</span>
            <span className="tema-preview__nav-item">Caja</span>
          </div>
        </aside>

        {/* Main */}
        <div className="tema-preview__main">
          {/* Top bar */}
          <div className="tema-preview__topbar" style={{ borderColor: temaTpv.border }}>
            <span style={{ fontWeight: 700 }}>Dashboard</span>
            <span style={{ color: temaTpv.text, opacity: 0.5, fontSize: "0.75rem" }}>16:32</span>
          </div>

          {/* Mesa cards */}
          <div className="tema-preview__cards">
            {[
              { mesa: "Mesa 1", total: "24,50 €", tipo: "abierta" },
              { mesa: "Mesa 3", total: "", tipo: "cerrada" },
              { mesa: "Mesa 5", total: "18,00 €", tipo: "mia" },
            ].map((m) => {
              const bgColor = m.tipo === "abierta" ? temaTpv.mesaAbiertaBg
                : m.tipo === "mia" ? temaTpv.mesaMiaBg
                : temaTpv.mesaCerradaBg;
              const borderColor = m.tipo === "abierta" ? temaTpv.mesaAbiertaBorder
                : m.tipo === "mia" ? temaTpv.mesaMiaBorder
                : temaTpv.mesaCerradaBorder;
              const label = m.tipo === "abierta" ? "Abierta"
                : m.tipo === "mia" ? "Es mía"
                : "Cerrada";

              return (
                <div
                  key={m.mesa}
                  className="tema-preview__card"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: m.tipo === "mia" ? "2px" : "1px",
                  }}
                >
                  <div className="tema-preview__card-head">
                    <span style={{ fontWeight: 700 }}>{m.mesa}</span>
                    <span
                      className="tema-preview__badge"
                      style={{
                        backgroundColor: m.tipo === "cerrada" ? "rgba(255,255,255,0.15)" : borderColor,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {m.total && (
                    <div className="tema-preview__card-foot">
                      <span>{m.total}</span>
                      <button
                        type="button"
                        className="tema-preview__btn"
                        style={{ backgroundColor: temaTpv.secondary, color: "#fff" }}
                      >
                        Cobrar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status pills */}
          <div className="tema-preview__pills">
            <span className="tema-preview__pill" style={{ backgroundColor: temaTpv.success }}>Correcto</span>
            <span className="tema-preview__pill" style={{ backgroundColor: temaTpv.warning }}>Aviso</span>
            <span className="tema-preview__pill" style={{ backgroundColor: temaTpv.danger }}>Error</span>
            <span className="tema-preview__pill" style={{ backgroundColor: temaTpv.info }}>Info</span>
          </div>
        </div>
      </div>
    </section>
  );
}
