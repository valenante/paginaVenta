import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useLocale } from "../hooks/useLocale";
import "./TakeawayConfigPage.css";

const DEFAULTS = {
  habilitado: false,
  deliveryHabilitado: false,
  aceptandoPedidos: true,
  tiempoPreparacionMin: 20,
  pedidoMinimo: 0,
  tarifaDelivery: 0,
  requiereNombre: true,
  requiereTelefono: false,
  requiereEmail: false,
  modoPago: "al_recoger",
  emailConfirmacion: true,
  emailCambioEstado: false,
  notificacionSonidoTPV: true,
  mensajeBienvenida: "",
  mensajeCerrado: "",
  mensajeConfirmacion: "",
  instruccionesRecogida: "",
};

const TABS = [
  { key: "servicio", label: "Servicio" },
  { key: "pedidos", label: "Pedidos" },
  { key: "notificaciones", label: "Notificaciones" },
  { key: "textos", label: "Textos" },
];

function Toggle({ on, saving, onToggle }) {
  return (
    <div className="tkw-number-input-wrap">
      <button
        className={`tkw-toggle ${on ? "tkw-toggle--on" : ""}`}
        onClick={onToggle}
        disabled={saving}
      >
        <span className="tkw-toggle__knob" />
      </button>
      {saving && <span className="tkw-saving">Guardando...</span>}
    </div>
  );
}

function TabServicio({ config, save, saving }) {
  const TOGGLES = [
    { key: "habilitado", label: "Takeaway activo", desc: "Permite pedidos para recoger desde la carta QR." },
    { key: "deliveryHabilitado", label: "Delivery activo", desc: "Permite pedidos con entrega a domicilio." },
    { key: "aceptandoPedidos", label: "Aceptando pedidos ahora", desc: "Desactiva temporalmente para pausar sin desactivar el servicio." },
  ];

  const MODO_PAGO_OPTIONS = [
    { value: "al_recoger", label: "Pago al recoger" },
    { value: "online_obligatorio", label: "Pago online obligatorio" },
    { value: "online_opcional", label: "Pago online opcional" },
  ];

  return (
    <div className="tkw-tab">
      {!config.habilitado && (
        <div className="tkw-banner tkw-banner--info">
          Takeaway esta desactivado. Activalo para que los clientes puedan hacer pedidos desde la carta QR.
        </div>
      )}

      <div className="tkw-section">
        <h3 className="tkw-section__title">Estado del servicio</h3>
        <p className="tkw-section__desc">Controla que servicios estan activos y si aceptas pedidos ahora mismo.</p>
        {TOGGLES.map((t) => (
          <div key={t.key} className="tkw-toggle-row">
            <div>
              <span className="tkw-toggle-label">{t.label}</span>
              <span className="tkw-toggle-desc">{t.desc}</span>
            </div>
            <Toggle
              on={!!config[t.key]}
              saving={saving === t.key}
              onToggle={() => save(t.key, !config[t.key])}
            />
          </div>
        ))}
      </div>

      <div className="tkw-section">
        <h3 className="tkw-section__title">Modo de pago</h3>
        <p className="tkw-section__desc">Como pagan los clientes sus pedidos de takeaway y delivery.</p>
        <div className="tkw-select-row">
          <div>
            <span className="tkw-toggle-label">Metodo de pago</span>
            <span className="tkw-toggle-desc">
              {config.modoPago === "al_recoger" && "El cliente paga cuando recoge el pedido."}
              {config.modoPago === "online_obligatorio" && "El cliente debe pagar online antes de confirmar."}
              {config.modoPago === "online_opcional" && "El cliente puede elegir pagar online o al recoger."}
            </span>
          </div>
          <div className="tkw-number-input-wrap">
            <select
              className="tkw-select"
              value={config.modoPago || "al_recoger"}
              onChange={(e) => save("modoPago", e.target.value)}
              disabled={saving === "modoPago"}
            >
              {MODO_PAGO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {saving === "modoPago" && <span className="tkw-saving">Guardando...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabPedidos({ config, save, saving, setConfig }) {
  const { currencySymbol } = useLocale();
  const TOGGLES = [
    { key: "requiereNombre", label: "Nombre obligatorio", desc: "El cliente debe indicar su nombre." },
    { key: "requiereTelefono", label: "Telefono obligatorio", desc: "El cliente debe dejar su numero de telefono." },
    { key: "requiereEmail", label: "Email obligatorio", desc: "El cliente debe dejar su email." },
  ];

  const NUMBERS = [
    { key: "tiempoPreparacionMin", label: "Tiempo estimado de preparacion", desc: "Se muestra al cliente como tiempo aproximado.", unit: "min", min: 1, max: 180, step: 5 },
    { key: "pedidoMinimo", label: "Pedido minimo", desc: "No se aceptan pedidos por debajo de esta cantidad.", unit: currencySymbol, min: 0, max: 9999, step: 1, isMoney: true },
    { key: "tarifaDelivery", label: "Tarifa de delivery", desc: "Coste de envio que se suma al pedido.", unit: currencySymbol, min: 0, max: 9999, step: 1, isMoney: true },
  ];

  return (
    <div className="tkw-tab">
      <div className="tkw-section">
        <h3 className="tkw-section__title">Parametros del pedido</h3>
        <p className="tkw-section__desc">Tiempos, importes minimos y tarifa de delivery.</p>
        {NUMBERS.map((n) => (
          <div key={n.key} className="tkw-number-row">
            <div>
              <span className="tkw-toggle-label">{n.label}</span>
              <span className="tkw-toggle-desc">{n.desc}</span>
            </div>
            <div className="tkw-number-input-wrap">
              <input
                type="number"
                className="tkw-number-input"
                value={config[n.key] ?? 0}
                min={n.min}
                max={n.max}
                step={n.step}
                onChange={(e) => setConfig((prev) => ({ ...prev, [n.key]: Number(e.target.value) }))}
                onBlur={(e) => {
                  const v = Math.max(n.min, Math.min(n.max, Number(e.target.value) || 0));
                  if (v !== config[n.key]) save(n.key, v);
                }}
                disabled={saving === n.key}
              />
              <span className="tkw-number-unit">{n.isMoney ? currencySymbol : n.unit}</span>
              {saving === n.key && <span className="tkw-saving">...</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="tkw-section">
        <h3 className="tkw-section__title">Datos del cliente</h3>
        <p className="tkw-section__desc">Que datos son obligatorios al hacer un pedido.</p>
        {TOGGLES.map((t) => (
          <div key={t.key} className="tkw-toggle-row">
            <div>
              <span className="tkw-toggle-label">{t.label}</span>
              <span className="tkw-toggle-desc">{t.desc}</span>
            </div>
            <Toggle
              on={!!config[t.key]}
              saving={saving === t.key}
              onToggle={() => save(t.key, !config[t.key])}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TabNotificaciones({ config, save, saving }) {
  const TOGGLES = [
    { key: "emailConfirmacion", label: "Email de confirmacion", desc: "Envia un email al cliente con el resumen del pedido y enlace de seguimiento." },
    { key: "emailCambioEstado", label: "Email por cambio de estado", desc: "Notifica al cliente por email cada vez que el pedido cambia de estado (preparando, listo, enviado)." },
    { key: "notificacionSonidoTPV", label: "Sonido en el TPV", desc: "Reproduce un sonido en el TPV cuando llega un nuevo pedido de takeaway/delivery." },
  ];

  return (
    <div className="tkw-tab">
      <div className="tkw-section">
        <h3 className="tkw-section__title">Notificaciones al cliente</h3>
        <p className="tkw-section__desc">Controla que emails recibe el cliente sobre su pedido.</p>
        {TOGGLES.filter((t) => t.key !== "notificacionSonidoTPV").map((t) => (
          <div key={t.key} className="tkw-toggle-row">
            <div>
              <span className="tkw-toggle-label">{t.label}</span>
              <span className="tkw-toggle-desc">{t.desc}</span>
            </div>
            <Toggle
              on={!!config[t.key]}
              saving={saving === t.key}
              onToggle={() => save(t.key, !config[t.key])}
            />
          </div>
        ))}
      </div>

      <div className="tkw-section">
        <h3 className="tkw-section__title">Notificaciones al restaurante</h3>
        <p className="tkw-section__desc">Como te enteras de que ha entrado un pedido nuevo.</p>
        <div className="tkw-toggle-row">
          <div>
            <span className="tkw-toggle-label">Sonido en el TPV</span>
            <span className="tkw-toggle-desc">Reproduce un sonido en el TPV cuando llega un nuevo pedido de takeaway/delivery.</span>
          </div>
          <Toggle
            on={!!config.notificacionSonidoTPV}
            saving={saving === "notificacionSonidoTPV"}
            onToggle={() => save("notificacionSonidoTPV", !config.notificacionSonidoTPV)}
          />
        </div>
      </div>
    </div>
  );
}

function TabTextos({ config, save, saving, setConfig }) {
  const TEXTOS = [
    {
      key: "mensajeBienvenida",
      label: "Mensaje de bienvenida",
      desc: "Se muestra arriba de la pagina de takeaway. Ideal para horarios, promociones o instrucciones.",
      placeholder: "Ej: Pedidos listos en 20 min. Recoge en barra.",
    },
    {
      key: "mensajeCerrado",
      label: "Mensaje de cerrado",
      desc: "Se muestra cuando el servicio esta pausado (aceptandoPedidos = off).",
      placeholder: "Ej: Ahora mismo no aceptamos pedidos. Volvemos a las 12:00.",
    },
    {
      key: "mensajeConfirmacion",
      label: "Mensaje de confirmacion",
      desc: "Se muestra al cliente despues de enviar su pedido.",
      placeholder: "Ej: Gracias por tu pedido. Te avisaremos cuando este listo.",
    },
    {
      key: "instruccionesRecogida",
      label: "Instrucciones de recogida",
      desc: "Instrucciones para el cliente sobre como y donde recoger su pedido.",
      placeholder: "Ej: Recoge en la barra. Muestra el codigo del pedido.",
    },
  ];

  return (
    <div className="tkw-tab">
      <div className="tkw-section">
        <h3 className="tkw-section__title">Textos personalizados</h3>
        <p className="tkw-section__desc">
          Personaliza los mensajes que ve el cliente en cada momento del flujo de takeaway. Dejalo vacio para usar el texto por defecto.
        </p>
        {TEXTOS.map((t) => (
          <div key={t.key} className="tkw-textarea-row">
            <div className="tkw-textarea-header">
              <div>
                <span className="tkw-toggle-label">{t.label}</span>
                <span className="tkw-toggle-desc">{t.desc}</span>
              </div>
              {saving === t.key && <span className="tkw-saving">Guardando...</span>}
            </div>
            <textarea
              className="tkw-textarea"
              placeholder={t.placeholder}
              value={config[t.key] || ""}
              onChange={(e) => setConfig((prev) => ({ ...prev, [t.key]: e.target.value }))}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (config[t.key] || "").trim()) save(t.key, v);
              }}
              maxLength={500}
              rows={2}
              disabled={saving === t.key}
            />
            <div className="tkw-textarea-hint">{(config[t.key] || "").length}/500</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TakeawayConfigPage() {
  const [config, setConfig] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [tab, setTab] = useState("servicio");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/config/takeaway");
        const tk = data?.data?.takeaway || data?.takeaway || {};
        setConfig({ ...DEFAULTS, ...tk });
      } catch {
        setConfig(DEFAULTS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async (key, value) => {
    setSaving(key);
    setMensaje(null);
    try {
      await api.put("/config/takeaway", { [key]: value });
      setConfig((prev) => ({ ...prev, [key]: value }));
      setMensaje({ tipo: "ok", texto: "Guardado" });
      setTimeout(() => setMensaje(null), 2000);
    } catch {
      setMensaje({ tipo: "error", texto: "Error al guardar" });
    } finally {
      setSaving(null);
    }
  }, []);

  if (loading) {
    return <div className="tkw-root"><div className="tkw-loading">Cargando configuracion...</div></div>;
  }

  const badgeClass = !config.habilitado
    ? "tkw-header__badge--off"
    : config.aceptandoPedidos
      ? "tkw-header__badge--on"
      : "tkw-header__badge--paused";
  const badgeText = !config.habilitado
    ? "Desactivado"
    : config.aceptandoPedidos
      ? "Activo"
      : "Pausado";

  return (
    <div className="tkw-root">
      <div className="tkw-header">
        <div>
          <h2>Takeaway y Delivery</h2>
          <p className="tkw-header__sub">
            Configura pedidos para recoger y entrega a domicilio desde la carta QR.
          </p>
        </div>
        <div className={`tkw-header__badge ${badgeClass}`}>{badgeText}</div>
      </div>

      {mensaje && (
        <div className={`tkw-toast tkw-toast--${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <div className="tkw-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tkw-tab-btn ${tab === t.key ? "tkw-tab-btn--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "servicio" && <TabServicio config={config} save={save} saving={saving} />}
      {tab === "pedidos" && <TabPedidos config={config} save={save} saving={saving} setConfig={setConfig} />}
      {tab === "notificaciones" && <TabNotificaciones config={config} save={save} saving={saving} />}
      {tab === "textos" && <TabTextos config={config} save={save} saving={saving} setConfig={setConfig} />}
    </div>
  );
}
