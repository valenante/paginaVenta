import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useConfig } from "../context/ConfigContext.jsx";
import "../styles/ConfigImpresionPage.css";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import ErrorToast from "../components/common/ErrorToast.jsx";
import TicketPreview from "../components/Config/TicketPreview.jsx";

const DEFAULT_ESTILO = {
  logoEnTicket: false,
  logoAncho: 300,
  encabezado: "",
  pie: "",
  mostrarNombreRestaurante: true,
  mostrarDireccion: true,
  tamanoTitulo: "doble_alto",
  tamanoProducto: "doble_alto",
  tamanoDetalle: "normal",
  tamanoTotal: "doble",
  estiloSeparador: "guion",
  qrValoracionesActivo: true,
  qrTexto: "Valora tu experiencia",
  anchoPapel: "80mm",
};

/* ================================================================
   MODAL: Diseño del ticket
   ================================================================ */
function TicketDesignModal({ estilo, onChange, onClose, onSave, onTestPrint, loading, config, tipoPreview, setTipoPreview }) {
  const update = (key, value) => onChange({ ...estilo, [key]: value });

  // Cerrar con ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="td-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="td-modal" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="td-modal-header">
          <div>
            <h2>Diseño del ticket</h2>
            <p className="td-modal-subtitle">
              Personaliza fuentes, logo, frases y separadores. La vista previa se
              actualiza en tiempo real.
            </p>
          </div>
          <button className="td-modal-close" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </header>

        {/* Body: form + preview */}
        <div className="td-modal-body">
          <div className="td-form">
            {/* ── Papel ── */}
            <fieldset className="td-fieldset">
              <legend>Papel</legend>
              <div className="config-field">
                <label>Ancho</label>
                <select value={estilo.anchoPapel} onChange={(e) => update("anchoPapel", e.target.value)} disabled={loading}>
                  <option value="80mm">80 mm (estandar)</option>
                  <option value="58mm">58 mm (compacto)</option>
                </select>
              </div>
            </fieldset>

            {/* ── Logo ── */}
            <fieldset className="td-fieldset">
              <legend>Logo</legend>
              <div className="config-field">
                <label className="config-checkbox">
                  <input type="checkbox" checked={estilo.logoEnTicket} onChange={(e) => update("logoEnTicket", e.target.checked)} disabled={loading} />
                  Imprimir logo en ticket
                </label>
              </div>
              {estilo.logoEnTicket && (
                <div className="config-field">
                  <label>Ancho del logo (px)</label>
                  <input type="number" min={100} max={500} value={estilo.logoAncho} onChange={(e) => update("logoAncho", Number(e.target.value) || 300)} disabled={loading} />
                </div>
              )}
            </fieldset>

            {/* ── Cabecera ── */}
            <fieldset className="td-fieldset">
              <legend>Cabecera</legend>
              <div className="config-field">
                <label className="config-checkbox">
                  <input type="checkbox" checked={estilo.mostrarNombreRestaurante} onChange={(e) => update("mostrarNombreRestaurante", e.target.checked)} disabled={loading} />
                  Nombre del restaurante
                </label>
              </div>
              <div className="config-field">
                <label className="config-checkbox">
                  <input type="checkbox" checked={estilo.mostrarDireccion} onChange={(e) => update("mostrarDireccion", e.target.checked)} disabled={loading} />
                  Direccion y NIF
                </label>
              </div>
              <div className="config-field">
                <label>Frase de encabezado</label>
                <input type="text" maxLength={200} placeholder="Ej: Bienvenido a nuestro restaurante" value={estilo.encabezado} onChange={(e) => update("encabezado", e.target.value)} disabled={loading} />
              </div>
              <div className="config-field">
                <label>Frase de pie</label>
                <input type="text" maxLength={200} placeholder="Ej: Gracias por su visita" value={estilo.pie} onChange={(e) => update("pie", e.target.value)} disabled={loading} />
              </div>
            </fieldset>

            {/* ── Fuentes ── */}
            <fieldset className="td-fieldset">
              <legend>Fuentes</legend>
              <div className="print-config-grid">
                {[
                  ["tamanoTitulo", "Titulo"],
                  ["tamanoProducto", "Productos"],
                  ["tamanoDetalle", "Detalles"],
                  ["tamanoTotal", "Total"],
                ].map(([key, label]) => (
                  <div className="config-field" key={key}>
                    <label>{label}</label>
                    <select value={estilo[key]} onChange={(e) => update(key, e.target.value)} disabled={loading}>
                      <option value="normal">Normal</option>
                      <option value="doble_alto">Doble alto</option>
                      {key !== "tamanoDetalle" && <option value="doble_ancho">Doble ancho</option>}
                      {key !== "tamanoDetalle" && <option value="doble">Doble alto + ancho</option>}
                    </select>
                  </div>
                ))}
              </div>
            </fieldset>

            {/* ── Separador ── */}
            <fieldset className="td-fieldset">
              <legend>Separadores</legend>
              <div className="config-field">
                <label>Estilo</label>
                <select value={estilo.estiloSeparador} onChange={(e) => update("estiloSeparador", e.target.value)} disabled={loading}>
                  <option value="guion">Guiones  ---</option>
                  <option value="linea">Linea  ___</option>
                  <option value="igual">Igual  ===</option>
                  <option value="punto">Puntos  ...</option>
                  <option value="espacio">Espacio en blanco</option>
                </select>
              </div>
            </fieldset>

            {/* ── QR ── */}
            <fieldset className="td-fieldset">
              <legend>QR Valoraciones</legend>
              <div className="config-field">
                <label className="config-checkbox">
                  <input type="checkbox" checked={estilo.qrValoracionesActivo} onChange={(e) => update("qrValoracionesActivo", e.target.checked)} disabled={loading} />
                  Incluir QR en cuenta
                </label>
              </div>
              {estilo.qrValoracionesActivo && (
                <div className="config-field">
                  <label>Texto sobre el QR</label>
                  <input type="text" maxLength={100} placeholder="Valora tu experiencia" value={estilo.qrTexto} onChange={(e) => update("qrTexto", e.target.value)} disabled={loading} />
                </div>
              )}
            </fieldset>
          </div>

          {/* ── Preview ── */}
          <div className="td-preview">
            <div className="tp-type-tabs">
              {["cuenta", "pedido", "factura"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tp-type-tab ${tipoPreview === t ? "tp-type-tab--active" : ""}`}
                  onClick={() => setTipoPreview(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <TicketPreview
              estilo={estilo}
              tipoTicket={tipoPreview}
              fiscal={config?.sif || {}}
              logoUrl={config?.branding?.logoUrl || null}
              nombreRestaurante={config?.branding?.nombreRestaurante || config?.nombre || ""}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="td-modal-footer">
          <button type="button" className="btn btn-secundario" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn" onClick={onTestPrint} disabled={loading}>
            🧾 Imprimir prueba
          </button>
          <button type="button" className="btn btn-primario" onClick={onSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar diseño"}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ================================================================
   PÁGINA PRINCIPAL
   ================================================================ */
export default function ConfigImpresionPage() {
  const navigate = useNavigate();
  const { config, refreshConfig } = useConfig();

  const [impCocina, setImpCocina] = useState("");
  const [impBarra, setImpBarra] = useState("");
  const [impCaja, setImpCaja] = useState("");
  const [impTickets, setImpTickets] = useState("");

  const [impresoras, setImpresoras] = useState([]);
  const [estado, setEstado] = useState("unknown");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Estilo de ticket + modal
  const [estiloTicket, setEstiloTicket] = useState(DEFAULT_ESTILO);
  const [tipoPreview, setTipoPreview] = useState("cuenta");
  const [showDesignModal, setShowDesignModal] = useState(false);

  useEffect(() => {
    setImpCocina(config?.impresion?.impresoras?.cocina || "");
    setImpBarra(config?.impresion?.impresoras?.barra || "");
    setImpCaja(config?.impresion?.impresoras?.caja || "");
    setImpTickets(config?.impresion?.impresoras?.tickets || "");

    const saved = config?.impresion?.estiloTicket;
    if (saved && typeof saved === "object") {
      setEstiloTicket((prev) => ({ ...prev, ...saved }));
    }
  }, [config]);

  // ── Change detection ──
  const asignacionInicial = useMemo(
    () => ({
      cocina: config?.impresion?.impresoras?.cocina || "",
      barra: config?.impresion?.impresoras?.barra || "",
      caja: config?.impresion?.impresoras?.caja || "",
      tickets: config?.impresion?.impresoras?.tickets || "",
    }),
    [config]
  );

  const estiloInicial = useMemo(
    () => ({ ...DEFAULT_ESTILO, ...(config?.impresion?.estiloTicket || {}) }),
    [config]
  );

  const asignacionActual = useMemo(
    () => ({ cocina: impCocina, barra: impBarra, caja: impCaja, tickets: impTickets }),
    [impCocina, impBarra, impCaja, impTickets]
  );

  const hasChanges = useMemo(() => {
    const impChanged = JSON.stringify(asignacionActual) !== JSON.stringify(asignacionInicial);
    const estiloChanged = JSON.stringify(estiloTicket) !== JSON.stringify(estiloInicial);
    return impChanged || estiloChanged;
  }, [asignacionActual, asignacionInicial, estiloTicket, estiloInicial]);

  const valoresActuales = useMemo(
    () => [impCocina, impBarra, impCaja, impTickets].filter(Boolean),
    [impCocina, impBarra, impCaja, impTickets]
  );

  const opcionesImpresoras = useMemo(() => {
    return Array.from(new Set([...valoresActuales, ...impresoras])).sort();
  }, [valoresActuales, impresoras]);

  // ── Helpers ──
  const estadoFromError = (e) => {
    const f = e?.fields?.estado;
    if (f === "online" || f === "offline" || f === "unknown") return f;
    if (e?.code === "PRINT_AGENT_OFFLINE") return "offline";
    if (e?.code === "PRINT_AGENT_UNAUTHORIZED") return "offline";
    return "unknown";
  };

  // ── API actions ──
  const listarImpresoras = async () => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      const { data } = await api.get("/impresoras/listar");
      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];
      setImpresoras(lista);
      setEstado(data?.estado || "unknown");
      setSuccess(`Se detectaron ${lista.length} impresoras`);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setEstado(estadoFromError(normalized));
      setImpresoras([]);
      setError({ ...normalized, retryFn: listarImpresoras });
    } finally {
      setLoading(false);
    }
  };

  const guardar = async (reason = "Cambios impresión") => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      const patch = {
        "impresion.impresoras": { cocina: impCocina, barra: impBarra, caja: impCaja, tickets: impTickets },
        "impresion.estiloTicket": estiloTicket,
      };
      const { data: draft } = await api.post("/admin/config/versions", { patch, scope: "impresion_config", reason });
      const versionId = draft?.version?.id || draft?.versionId || draft?.id;
      if (!versionId) throw new Error("No se recibió versionId del draft");
      await api.post(`/admin/config/versions/${versionId}/apply`, { reason });
      await refreshConfig();
      setSuccess("Configuración guardada correctamente");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({ ...normalized, retryFn: () => guardar(reason) });
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (reason = "Rollback impresión") => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      await api.post("/admin/config/rollback", { reason });
      await refreshConfig();
      await listarImpresoras();
      setSuccess("Rollback aplicado");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({ ...normalized, retryFn: () => handleRollback(reason) });
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async (estacion) => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      const { data } = await api.post("/impresoras/test", { estacion });
      setEstado(data?.estado || estado);
      setSuccess(data?.message || `Prueba enviada (${estacion})`);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setEstado(estadoFromError(normalized));
      setError({ ...normalized, retryFn: () => testPrint(estacion) });
    } finally {
      setLoading(false);
    }
  };

  /** Imprimir prueba con el estilo actual aplicado (desde el modal) */
  const testPrintConEstilo = useCallback(async () => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      const { data } = await api.post("/impresoras/test", {
        estacion: "caja",
        estiloTicket,
      });
      setEstado(data?.estado || estado);
      setSuccess(data?.message || "Prueba con diseño enviada a caja");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setEstado(estadoFromError(normalized));
      setError({ ...normalized, retryFn: testPrintConEstilo });
    } finally {
      setLoading(false);
    }
  }, [estiloTicket, estado]);

  const handleSaveFromModal = useCallback(() => {
    guardar("Cambios diseño ticket");
  }, [estiloTicket, impCocina, impBarra, impCaja, impTickets]);

  // ── Labels ──
  const estadoLabel = estado === "online" ? "Agente online" : estado === "offline" ? "Agente offline" : "Estado desconocido";
  const estadoClass = estado === "online" ? "print-config-status--online" : estado === "offline" ? "print-config-status--offline" : "print-config-status--unknown";

  // ── Resumen del estilo actual (para la card) ──
  const estiloResumen = useMemo(() => {
    const parts = [];
    parts.push(estiloTicket.anchoPapel);
    if (estiloTicket.logoEnTicket) parts.push("con logo");
    if (estiloTicket.encabezado) parts.push("encabezado");
    if (estiloTicket.pie) parts.push("pie");
    if (estiloTicket.qrValoracionesActivo) parts.push("QR");
    return parts.join(" · ");
  }, [estiloTicket]);

  return (
    <main className="print-config-page cfg-page cfg-page--fixed-bar section section--wide">
      {success && (
        <AlertaMensaje tipo="success" mensaje={success} onClose={() => setSuccess(null)} autoCerrar duracion={3200} />
      )}
      {error && (
        <ErrorToast error={error} onRetry={error.canRetry ? error.retryFn : undefined} onClose={() => setError(null)} />
      )}

      <header className="print-config-header cfg-header">
        <div>
          <h1>Configuración de impresión</h1>
          <p className="text-suave">
            Asigna impresoras por estación, personaliza el diseño del ticket y
            realiza pruebas sin salir del flujo de configuración.
          </p>
        </div>
        <div className="print-config-header-status">
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
                  Consulta el estado del agente, detecta impresoras conectadas y
                  entra al centro de impresión.
                </p>
              </div>
            </div>
            <div className="print-config-toolbar">
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
                <strong>{Object.values(asignacionActual).filter(Boolean).length} / 4</strong>
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
                ["imp-cocina", "Cocina", impCocina, setImpCocina],
                ["imp-barra", "Barra", impBarra, setImpBarra],
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
              Consejo: usa "Listar impresoras" antes de guardar si acabas de
              conectar una impresora nueva.
            </p>
          </section>

          {/* ── Diseño del ticket (card con botón → modal) ── */}
          <section className="card config-card td-card-trigger">
            <div className="td-card-row">
              <div>
                <h2>Diseño del ticket</h2>
                <p className="config-card-subtitle">
                  Logo, fuentes, frases, separadores y QR. Vista previa en tiempo real.
                </p>
                <p className="td-card-resumen">{estiloResumen}</p>
              </div>
              <button
                type="button"
                className="btn btn-primario"
                onClick={() => setShowDesignModal(true)}
                disabled={loading}
              >
                Personalizar ticket
              </button>
            </div>
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
              {["cocina", "barra", "caja", "tickets"].map((est) => (
                <button key={est} type="button" className="btn" onClick={() => testPrint(est)} disabled={loading}>
                  Probar {est.charAt(0).toUpperCase() + est.slice(1)}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Action bar fijo ── */}
      <div className="print-config-actions cfg-actions-bar">
        <button
          type="button"
          className="btn btn-primario"
          onClick={() => guardar("Cambios impresión")}
          disabled={loading || !hasChanges}
          title={!hasChanges ? "No hay cambios para guardar" : ""}
        >
          {loading ? "Guardando..." : "Guardar configuración"}
        </button>
        <button type="button" className="btn btn-secundario" onClick={() => handleRollback("Rollback impresión")} disabled={loading}>
          Revertir último cambio
        </button>
      </div>

      {/* ── Modal diseño ticket ── */}
      {showDesignModal && (
        <TicketDesignModal
          estilo={estiloTicket}
          onChange={setEstiloTicket}
          onClose={() => setShowDesignModal(false)}
          onSave={handleSaveFromModal}
          onTestPrint={testPrintConEstilo}
          loading={loading}
          config={config}
          tipoPreview={tipoPreview}
          setTipoPreview={setTipoPreview}
        />
      )}
    </main>
  );
}
