// src/pages/ConfigImpresionShopPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useConfig } from "../context/ConfigContext.jsx";
import "../styles/ConfigImpresionPage.css";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";

/* Paridad de UI y UX con ConfigImpresionPage (restaurante) en lo que la tienda también usa:
   agente y herramientas, asignación de Caja y Tickets, pruebas y barra de acciones.

   Contrato de API de la tienda (no cambia en este lote):
     GET  /impresoras/listar        → { impresoras, estado }
     POST /impresoras/configurar    body { impresoras: { caja, tickets } }
     POST /impresoras/test          body { impresora }   ("" = impresora predeterminada)

   Fuera de este lote a propósito:
     - Diseño del ticket: la pantalla de restaurante lo guarda con /admin/config/versions,
       un contrato distinto al de la tienda.
     - Revertir: la pantalla de tienda no lo tiene. El rollback de restaurante
       (/admin/config/rollback) puede deshacer un cambio de otra pantalla, y guardar
       en la tienda no crea versiones. Decisión registrada: se oculta en tienda. */

// Mismo mapeo de estado que ConfigImpresionPage (restaurante).
function estadoFromError(e) {
  const f = e?.fields?.estado;
  if (f === "online" || f === "offline" || f === "unknown") return f;
  if (e?.code === "PRINT_AGENT_OFFLINE") return "offline";
  if (e?.code === "PRINT_AGENT_UNAUTHORIZED") return "offline";
  return "unknown";
}

export default function ConfigImpresionShopPage() {
  const navigate = useNavigate();
  const { config, refreshConfig } = useConfig();

  const [impCaja, setImpCaja] = useState("");
  const [impTickets, setImpTickets] = useState("");

  // Sembrado UNA sola vez: un refresco posterior de `config` no pisa la selección en curso
  // (mismo criterio que ConfigImpresionPage).
  const seededRef = useRef(false);

  const [impresoras, setImpresoras] = useState([]);
  const [estado, setEstado] = useState("unknown");
  // `loading` bloquea toda la pantalla (listar, probar, guardar). `saving` solo cambia la etiqueta
  // de Guardar: "Guardando..." no debe aparecer mientras se listan impresoras.
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (seededRef.current || !config) return;
    seededRef.current = true;
    setImpCaja(config?.impresion?.impresoras?.caja || "");
    setImpTickets(config?.impresion?.impresoras?.tickets || "");
  }, [config]);

  // ── Change detection ──
  const asignacionInicial = useMemo(
    () => ({
      caja: config?.impresion?.impresoras?.caja || "",
      tickets: config?.impresion?.impresoras?.tickets || "",
    }),
    [config]
  );

  const hasChanges = impCaja !== asignacionInicial.caja || impTickets !== asignacionInicial.tickets;

  // Una impresora guardada siempre aparece como opción, aunque el agente no la detecte;
  // si no, el select se quedaría sin valor visible mientras el estado conserva el dato.
  const opcionesImpresoras = useMemo(
    () => Array.from(new Set([impCaja, impTickets, ...impresoras].filter(Boolean))).sort(),
    [impCaja, impTickets, impresoras]
  );

  const estadoLabel =
    estado === "online" ? "Agente online" : estado === "offline" ? "Agente offline" : "Estado desconocido";
  const estadoClass =
    estado === "online"
      ? "print-config-status--online"
      : estado === "offline"
        ? "print-config-status--offline"
        : "print-config-status--unknown";

  const configuradas = [impCaja, impTickets].filter(Boolean).length;

  /* =====================
     Listar impresoras
  ===================== */
  const listarImpresoras = async () => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      const { data } = await api.get("/impresoras/listar");
      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];
      setImpresoras(lista);
      setEstado(data?.estado || "unknown");
      setSuccess(`Se detectaron ${lista.length} ${lista.length === 1 ? "impresora" : "impresoras"}`);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setEstado(estadoFromError(normalized));
      setImpresoras([]);
      setError({ ...normalized, retryFn: listarImpresoras });
    } finally {
      setLoading(false);
    }
  };

  // Auto-listar al abrir (best-effort, igual que restaurante): puebla las opciones sin obligar
  // a pulsar "Listar impresoras". Si el agente no responde, la impresora guardada sigue visible.
  useEffect(() => {
    listarImpresoras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================
     Guardar configuración
  ===================== */
  const guardar = async () => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      setSaving(true);
      await api.post("/impresoras/configurar", {
        impresoras: { caja: impCaja, tickets: impTickets },
      });
      await refreshConfig();
      setSuccess("Configuración guardada correctamente");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({ ...normalized, retryFn: guardar });
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  /* =====================
     Prueba de impresión
  ===================== */
  const testPrint = async (impresora, label) => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      const { data } = await api.post("/impresoras/test", { impresora: impresora || "" });
      setEstado(data?.estado || estado);
      setSuccess(data?.message || `Prueba enviada (${label})`);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setEstado(estadoFromError(normalized));
      setError({ ...normalized, retryFn: () => testPrint(impresora, label) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="print-config-page cfg-page cfg-page--fixed-bar section section--wide">
      {success && (
        <AlertaMensaje tipo="exito" mensaje={success} onClose={() => setSuccess(null)} autoCerrar duracion={3200} />
      )}
      {error && (
        <ErrorToast error={error} onRetry={error.canRetry ? error.retryFn : undefined} onClose={() => setError(null)} />
      )}

      <header className="print-config-header cfg-header">
        <div>
          <h1>Configuración de impresión</h1>
          <p className="text-suave">
            Asigna la impresora de caja y la de tickets de la tienda, consulta el agente y haz
            pruebas sin salir de esta pantalla.
          </p>
        </div>
        <div className="print-config-header-status cfg-header-status">
          <span className={`print-config-status ${estadoClass}`}>
            <span className="print-config-status__dot" />
            {estadoLabel}
          </span>
        </div>
      </header>

      <div className="print-config-layout cfg-layout">
        <div className="print-config-main">
          {/* ── Agente ── */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Agente y herramientas</h2>
                <p className="config-card-subtitle">
                  Consulta el estado del agente, detecta impresoras conectadas y entra al centro de impresión.
                </p>
              </div>
            </div>
            <div className="cfg-toolbar">
              <button type="button" className="btn" onClick={() => navigate("/configuracion/impresion/centro")} disabled={loading}>
                Centro de impresión
              </button>
              <button type="button" className="btn btn-primario" onClick={listarImpresoras} disabled={loading}>
                Listar impresoras
              </button>
            </div>
            <div className="print-config-stats cfg-stats">
              <article className="print-config-stat cfg-stat">
                <span className="print-config-stat__label cfg-stat__label">Estado del agente</span>
                <strong>{estadoLabel}</strong>
              </article>
              <article className="print-config-stat cfg-stat">
                <span className="print-config-stat__label cfg-stat__label">Impresoras detectadas</span>
                <strong>{impresoras.length}</strong>
              </article>
              <article className="print-config-stat cfg-stat">
                <span className="print-config-stat__label cfg-stat__label">Estaciones configuradas</span>
                <strong>{configuradas} / 2</strong>
              </article>
            </div>
          </section>

          {/* ── Asignación ── */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Asignación por estación</h2>
                <p className="config-card-subtitle">
                  Si una estación queda vacía se usará la impresora predeterminada.
                </p>
              </div>
            </div>
            <div className="print-config-grid">
              {[
                ["imp-caja", "Caja", impCaja, setImpCaja],
                ["imp-tickets", "Tickets", impTickets, setImpTickets],
              ].map(([id, label, value, setter]) => (
                <div className="config-field" key={id}>
                  <label htmlFor={id}>Impresora {label}</label>
                  <select id={id} value={value} onChange={(e) => setter(e.target.value)} disabled={loading}>
                    <option value="">-- Sin asignar / usar predeterminada --</option>
                    {opcionesImpresoras.map((imp) => <option key={imp} value={imp}>{imp}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <p className="print-config-note">
              Pulsa "Listar impresoras" para ver las detectadas. Si el agente no responde, verás
              solo las impresoras ya guardadas.
            </p>
          </section>

          {/* ── Pruebas ── */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Pruebas por estación</h2>
                <p className="config-card-subtitle">
                  Envía tickets de prueba para validar conexión y respuesta del agente.
                </p>
              </div>
            </div>
            <div className="print-config-tests">
              <button type="button" className="btn" onClick={() => testPrint(impCaja, "Caja")} disabled={loading}>
                Probar Caja
              </button>
              <button type="button" className="btn" onClick={() => testPrint(impTickets, "Tickets")} disabled={loading}>
                Probar Tickets
              </button>
            </div>
            <p className="print-config-note">
              Las pruebas usan la impresora seleccionada en pantalla, esté guardada o no. Sin asignar,
              se usa la predeterminada del sistema.
            </p>
          </section>
        </div>
      </div>

      {/* ── Barra de acciones fija ── */}
      <div className="print-config-actions cfg-actions-bar">
        <button
          type="button"
          className="btn btn-primario"
          onClick={guardar}
          disabled={loading || !hasChanges}
          title={!hasChanges ? "No hay cambios para guardar" : undefined}
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </main>
  );
}
