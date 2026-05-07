import React, { useState, useEffect } from "react";
import api from "../utils/api";
import "./AutomatizacionesPage.css";

const MODULES = [
  {
    id: "pedidos",
    icon: "📦",
    title: "Pedidos a proveedores",
    description: "Genera pedidos automáticos cuando el stock baja del mínimo.",
    configKey: "autoReorderMode",
    options: [
      { value: "off", label: "Desactivado", desc: "Solo manual desde el panel" },
      { value: "semi", label: "Semi-automático", desc: "Crea borradores + te avisa por email para aprobar" },
      { value: "auto", label: "Automático", desc: "Crea y envía pedidos al proveedor sin intervención" },
    ],
    info: "Basado en consumo por día de semana (8 semanas). Ejecuta cada mañana 8-11h.",
  },
  {
    id: "margen",
    icon: "⚠️",
    title: "Protección de márgenes",
    description: "Alerta cuando un producto cae por debajo del margen objetivo.",
    configKey: "marginAlertEnabled",
    options: [
      { value: "off", label: "Desactivado", desc: "" },
      { value: "on", label: "Activado", desc: "Email diario si hay márgenes bajo 30% o negativos" },
    ],
    info: "Incluye precio sugerido con pricing psicológico (.50/.90). Ejecuta diariamente.",
  },
  {
    id: "stock",
    icon: "📊",
    title: "Predicción de stock",
    description: "Predice qué ingredientes se agotan en los próximos 7 días.",
    configKey: "stockForecastEnabled",
    options: [
      { value: "off", label: "Desactivado", desc: "" },
      { value: "on", label: "Activado", desc: "Email de alerta si algo se agota antes de que llegue el proveedor" },
    ],
    info: "Modelo por día de semana + lead time del proveedor. Ejecuta cada mañana.",
  },
  {
    id: "pnl",
    icon: "💰",
    title: "P&L semanal",
    description: "Informe financiero automático cada lunes por email.",
    configKey: "weeklyPnlEnabled",
    options: [
      { value: "off", label: "Desactivado", desc: "" },
      { value: "on", label: "Activado", desc: "Ingresos, COGS, margen, beneficio neto, top/bottom productos" },
    ],
    info: "Se envía los lunes entre 7-10h al email del restaurante.",
  },
  {
    id: "cocina",
    icon: "🍳",
    title: "Informe de cocina",
    description: "Análisis semanal de cuellos de botella y productos lentos.",
    configKey: "kitchenReportEnabled",
    options: [
      { value: "off", label: "Desactivado", desc: "" },
      { value: "on", label: "Activado", desc: "Cuello de botella, tiempos, throughput por estación" },
    ],
    info: "Se envía los lunes junto con el P&L.",
  },
  {
    id: "menu",
    icon: "📋",
    title: "Ingeniería de menú",
    description: "Analiza la carta y auto-destaca productos estrella.",
    configKey: "menuEngineeringEnabled",
    options: [
      { value: "off", label: "Desactivado", desc: "" },
      { value: "on", label: "Activado", desc: "BCG matrix semanal + auto-marca destacados en carta" },
    ],
    info: "Ejecuta domingos noche. Clasifica en estrellas/vacas/incógnitas/perros.",
  },
  {
    id: "marketing",
    icon: "📣",
    title: "Marketing automático",
    description: "Emails a clientes dormidos y VIPs en riesgo.",
    configKey: "autoCampaignEnabled",
    options: [
      { value: "off", label: "Desactivado", desc: "" },
      { value: "on", label: "Activado", desc: "Campañas automáticas cada miércoles a segmentos de clientes" },
    ],
    info: "Requiere programa de fidelización activo. Cooldown 14 días por cliente.",
  },
  {
    id: "reservas",
    icon: "📅",
    title: "Reservas automáticas",
    description: "Auto-confirmación, recordatorios y no-show automático.",
    configKey: null, // Se configura en ReservasConfigPage
    linkTo: "reservas",
    info: "Configura en la sección de Reservas del panel.",
  },
];

export default function AutomatizacionesPage() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await api.get("/config/automations");
      setConfig(data.data?.automations || data.automations || {});
    } catch {
      // Config might not exist yet, use defaults
      setConfig({});
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (configKey, value) => {
    setSaving(configKey);
    setMensaje(null);
    try {
      await api.put("/config/automations", { [configKey]: value });
      setConfig((prev) => ({ ...prev, [configKey]: value }));
      setMensaje({ tipo: "ok", texto: "Guardado" });
      setTimeout(() => setMensaje(null), 2000);
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al guardar" });
    } finally {
      setSaving(null);
    }
  };

  const getValue = (key) => {
    if (!key) return null;
    const val = config[key];
    if (val === undefined || val === null) {
      // Defaults: pedidos=semi, rest=on
      if (key === "autoReorderMode") return "semi";
      return "on";
    }
    return val;
  };

  return (
    <div className="auto-root">
      <div className="auto-header">
        <div>
          <h2>🤖 Automatizaciones</h2>
          <p className="auto-subtitle">
            Configura qué procesos se ejecutan solos. Todo se envía al email del restaurante.
          </p>
        </div>
        {mensaje && (
          <span className={`auto-msg auto-msg--${mensaje.tipo}`}>{mensaje.texto}</span>
        )}
      </div>

      {loading ? (
        <div className="auto-loading">Cargando configuración...</div>
      ) : (
        <div className="auto-grid">
          {MODULES.map((mod) => {
            const currentValue = getValue(mod.configKey);

            return (
              <div key={mod.id} className="auto-card">
                <div className="auto-card__header">
                  <span className="auto-card__icon">{mod.icon}</span>
                  <div>
                    <h3 className="auto-card__title">{mod.title}</h3>
                    <p className="auto-card__desc">{mod.description}</p>
                  </div>
                </div>

                {mod.options ? (
                  <div className="auto-card__options">
                    {mod.options.map((opt) => (
                      <label
                        key={opt.value}
                        className={`auto-option ${currentValue === opt.value ? "auto-option--active" : ""}`}
                      >
                        <input
                          type="radio"
                          name={mod.id}
                          value={opt.value}
                          checked={currentValue === opt.value}
                          onChange={() => handleChange(mod.configKey, opt.value)}
                          disabled={saving === mod.configKey}
                        />
                        <div className="auto-option__body">
                          <span className="auto-option__label">{opt.label}</span>
                          {opt.desc && <span className="auto-option__desc">{opt.desc}</span>}
                        </div>
                        {saving === mod.configKey && currentValue === opt.value && (
                          <span className="auto-option__saving">...</span>
                        )}
                      </label>
                    ))}
                  </div>
                ) : mod.linkTo ? (
                  <div className="auto-card__link">
                    <span className="auto-card__link-text">Se configura en la sección de Reservas</span>
                  </div>
                ) : null}

                <div className="auto-card__footer">
                  <span className="auto-card__info">{mod.info}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
