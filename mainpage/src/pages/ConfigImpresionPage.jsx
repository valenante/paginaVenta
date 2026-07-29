import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useConfig } from "../context/ConfigContext.jsx";
import "../styles/ConfigImpresionPage.css";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import ErrorToast from "../components/common/ErrorToast.jsx";
import TicketPreview from "../components/Config/TicketPreview.jsx";
import { resolveEstiloTicket } from "../utils/resolveEstiloTicket.js";

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
  anchoPapel: "80mm",
  // ── Campos nuevos (default = conducta actual) ──
  mensajeAgradecimiento: "",
  pieLegal: "",
  mostrarColumnaCantidad: true,
  mostrarColumnaPrecio: true,
  mostrarColumnaImporte: true,
  mostrarComensales: false,
  mostrarAlergias: false,
  mostrarDatosFiscales: true,
  qrActivo: false,
  qrUrl: "", // Contenido del QR genérico (URL o texto). Vacío ⇒ no se imprime QR.
  idioma: "es",
  // Overrides por tipo de documento (parciales)
  porTipo: {},
};

/* Pestañas del editor: General = base; el resto edita porTipo[tipo] */
const DESIGN_TABS = [
  { key: "general", label: "General" },
  { key: "comanda", label: "Comanda" },
  { key: "cuenta", label: "Cuenta" },
  { key: "factura", label: "Factura" },
  { key: "shop", label: "Tienda" },
];

/* Etiqueta "Heredar de General" para los campos de una pestaña de tipo */
function InheritTag({ show, inherited, onToggle, loading }) {
  if (!show) return null;
  return (
    <label className="td-inherit" title="Heredar el valor de General">
      <input
        type="checkbox"
        checked={inherited}
        onChange={(e) => onToggle(e.target.checked)}
        disabled={loading}
      />
      Heredar
    </label>
  );
}

/* Fila de campo reutilizable del editor de ticket.
   - `label` + `children` (control) para inputs/selects (etiqueta arriba, control debajo).
   - `checkbox`: el propio `children` es el <label.config-checkbox> con el input dentro.
   - `inheritNode`: el toggle "Heredar" (o null); queda pegado a la etiqueta, no estirado.
   - `inherited`: atenúa la fila cuando el valor se hereda de General. */
function TdField({ label, inheritNode = null, inherited = false, checkbox = false, children }) {
  return (
    <div className={`td-field${inherited ? " td-field--inherited" : ""}`}>
      <div className="td-field__top">
        {checkbox ? children : <span className="td-field__label">{label}</span>}
        {inheritNode}
      </div>
      {!checkbox && <div className="td-field__control">{children}</div>}
    </div>
  );
}

/* ================================================================
   MODAL: Diseño del ticket — pestañas General / por tipo
   ================================================================ */
function TicketDesignModal({ estilo, onChange, onClose, onSave, onTestPrint, loading, config, activeTab, setActiveTab }) {
  const isType = activeTab !== "general";
  const tipoKey = activeTab; // comanda | cuenta | factura | shop
  const porTipo = estilo.porTipo || {};
  const override = (isType && porTipo[tipoKey]) || {};

  // Estilo resuelto para la pestaña activa (base + override del tipo)
  const resolved = useMemo(
    () => resolveEstiloTicket(estilo, isType ? tipoKey : null),
    [estilo, isType, tipoKey]
  );

  // Valor mostrado por campo: en un tipo, el override si existe la clave; si no, el resuelto (heredado)
  const val = (key) => {
    if (!isType) return estilo[key];
    return key in override ? override[key] : resolved[key];
  };
  const inherited = (key) => isType && !(key in override);
  const disabledFor = (key) => loading || (isType && inherited(key));

  const setVal = (key, value) => {
    if (!isType) {
      onChange({ ...estilo, [key]: value });
      return;
    }
    const nextOv = { ...override, [key]: value };
    onChange({ ...estilo, porTipo: { ...porTipo, [tipoKey]: nextOv } });
  };

  // Heredar => borrar la clave del override; dejar de heredar => sembrar con el valor resuelto
  const setInherit = (key, inh) => {
    if (!isType) return;
    const nextOv = { ...override };
    if (inh) delete nextOv[key];
    else nextOv[key] = resolved[key];
    onChange({ ...estilo, porTipo: { ...porTipo, [tipoKey]: nextOv } });
  };

  const inheritTag = (key) => (
    <InheritTag
      show={isType}
      inherited={inherited(key)}
      onToggle={(inh) => setInherit(key, inh)}
      loading={loading}
    />
  );

  // Preview: General se previsualiza como cuenta; cada tipo con su propio layout
  const previewTipo = activeTab === "general" ? "cuenta" : activeTab;

  // Factura + VeriFactu: los datos fiscales NO son ocultables
  const fiscalLock = activeTab === "factura" && !!config?.sif?.verifactuActivo;

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
              Personaliza cada tipo de documento. "General" es la base; en cada
              pestaña puedes sobrescribir campos o dejarlos heredados.
            </p>
          </div>
          <button className="td-modal-close" onClick={onClose} aria-label="Cerrar">
            &times;
          </button>
        </header>

        {/* Pestañas por tipo de documento */}
        <div className="td-tabs tp-type-tabs">
          {DESIGN_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tp-type-tab ${activeTab === t.key ? "tp-type-tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="td-tab-hint">
          Editando <strong>{DESIGN_TABS.find((t) => t.key === activeTab)?.label}</strong>
          {isType
            ? " — los campos marcados como “Heredar” toman el valor de General."
            : " — es la base que heredan los demás documentos."}
        </p>

        {/* Body: form + preview */}
        <div className="td-modal-body">
          <div className="td-form">
            {/* ── Papel ── */}
            <fieldset className="td-fieldset">
              <legend>Papel</legend>
              <TdField label="Ancho del papel" inheritNode={inheritTag("anchoPapel")} inherited={inherited("anchoPapel")}>
                <select value={val("anchoPapel")} onChange={(e) => setVal("anchoPapel", e.target.value)} disabled={disabledFor("anchoPapel")}>
                  <option value="80mm">80 mm (estandar)</option>
                  <option value="58mm">58 mm (compacto)</option>
                </select>
              </TdField>
            </fieldset>

            {/* ── Logo ── */}
            <fieldset className="td-fieldset">
              <legend>Logo</legend>
              <TdField checkbox inheritNode={inheritTag("logoEnTicket")} inherited={inherited("logoEnTicket")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("logoEnTicket")} onChange={(e) => setVal("logoEnTicket", e.target.checked)} disabled={disabledFor("logoEnTicket")} />
                  Imprimir logo en ticket
                </label>
              </TdField>
              {val("logoEnTicket") && (
                <TdField label="Ancho del logo (px)" inheritNode={inheritTag("logoAncho")} inherited={inherited("logoAncho")}>
                  <input type="number" min={100} max={500} value={val("logoAncho")} onChange={(e) => setVal("logoAncho", Number(e.target.value) || 300)} disabled={disabledFor("logoAncho")} />
                </TdField>
              )}
            </fieldset>

            {/* ── Cabecera ── */}
            <fieldset className="td-fieldset">
              <legend>Cabecera</legend>
              <TdField checkbox inheritNode={inheritTag("mostrarNombreRestaurante")} inherited={inherited("mostrarNombreRestaurante")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("mostrarNombreRestaurante")} onChange={(e) => setVal("mostrarNombreRestaurante", e.target.checked)} disabled={disabledFor("mostrarNombreRestaurante")} />
                  Nombre del restaurante
                </label>
              </TdField>
              <TdField checkbox inheritNode={inheritTag("mostrarDireccion")} inherited={inherited("mostrarDireccion")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("mostrarDireccion")} onChange={(e) => setVal("mostrarDireccion", e.target.checked)} disabled={disabledFor("mostrarDireccion")} />
                  Direccion y NIF
                </label>
              </TdField>
              <TdField label="Frase de encabezado" inheritNode={inheritTag("encabezado")} inherited={inherited("encabezado")}>
                <input type="text" maxLength={200} placeholder="Ej: Bienvenido a nuestro restaurante" value={val("encabezado") || ""} onChange={(e) => setVal("encabezado", e.target.value)} disabled={disabledFor("encabezado")} />
              </TdField>
              <TdField label="Frase de pie" inheritNode={inheritTag("pie")} inherited={inherited("pie")}>
                <input type="text" maxLength={200} placeholder="Ej: Gracias por su visita" value={val("pie") || ""} onChange={(e) => setVal("pie", e.target.value)} disabled={disabledFor("pie")} />
              </TdField>
            </fieldset>

            {/* ── Fuentes ── */}
            <fieldset className="td-fieldset">
              <legend>Fuentes</legend>
              <div className="td-grid-2">
                {[
                  ["tamanoTitulo", "Titulo"],
                  ["tamanoProducto", "Productos"],
                  ["tamanoDetalle", "Detalles"],
                  ["tamanoTotal", "Total"],
                ].map(([key, label]) => (
                  <TdField key={key} label={label} inheritNode={inheritTag(key)} inherited={inherited(key)}>
                    <select value={val(key)} onChange={(e) => setVal(key, e.target.value)} disabled={disabledFor(key)}>
                      <option value="normal">Normal</option>
                      <option value="doble_alto">Doble alto</option>
                      {key !== "tamanoDetalle" && <option value="doble_ancho">Doble ancho</option>}
                      {key !== "tamanoDetalle" && <option value="doble">Doble alto + ancho</option>}
                    </select>
                  </TdField>
                ))}
              </div>
              <TdField label="Estilo de separador" inheritNode={inheritTag("estiloSeparador")} inherited={inherited("estiloSeparador")}>
                <select value={val("estiloSeparador")} onChange={(e) => setVal("estiloSeparador", e.target.value)} disabled={disabledFor("estiloSeparador")}>
                  <option value="guion">Guiones  ---</option>
                  <option value="linea">Linea  ___</option>
                  <option value="igual">Igual  ===</option>
                  <option value="punto">Puntos  ...</option>
                  <option value="espacio">Espacio en blanco</option>
                </select>
              </TdField>
            </fieldset>

            {/* ── Productos (comanda de cocina) ── */}
            <fieldset className="td-fieldset">
              <legend>Productos (comanda de cocina)</legend>
              <TdField checkbox inheritNode={inheritTag("mostrarComensales")} inherited={inherited("mostrarComensales")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("mostrarComensales")} onChange={(e) => setVal("mostrarComensales", e.target.checked)} disabled={disabledFor("mostrarComensales")} />
                  Mostrar comensales
                </label>
              </TdField>
              <TdField checkbox inheritNode={inheritTag("mostrarAlergias")} inherited={inherited("mostrarAlergias")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("mostrarAlergias")} onChange={(e) => setVal("mostrarAlergias", e.target.checked)} disabled={disabledFor("mostrarAlergias")} />
                  Mostrar alergias
                </label>
              </TdField>
            </fieldset>

            {/* ── Columnas (cuenta / factura / tienda) ── */}
            <fieldset className="td-fieldset">
              <legend>Columnas de la tabla</legend>
              <TdField checkbox inheritNode={inheritTag("mostrarColumnaCantidad")} inherited={inherited("mostrarColumnaCantidad")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("mostrarColumnaCantidad")} onChange={(e) => setVal("mostrarColumnaCantidad", e.target.checked)} disabled={disabledFor("mostrarColumnaCantidad")} />
                  Columna cantidad
                </label>
              </TdField>
              <TdField checkbox inheritNode={inheritTag("mostrarColumnaPrecio")} inherited={inherited("mostrarColumnaPrecio")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("mostrarColumnaPrecio")} onChange={(e) => setVal("mostrarColumnaPrecio", e.target.checked)} disabled={disabledFor("mostrarColumnaPrecio")} />
                  Columna precio
                </label>
              </TdField>
              <TdField checkbox inheritNode={inheritTag("mostrarColumnaImporte")} inherited={inherited("mostrarColumnaImporte")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("mostrarColumnaImporte")} onChange={(e) => setVal("mostrarColumnaImporte", e.target.checked)} disabled={disabledFor("mostrarColumnaImporte")} />
                  Columna importe
                </label>
              </TdField>
            </fieldset>

            {/* ── Factura ── */}
            <fieldset className="td-fieldset">
              <legend>Factura</legend>
              <TdField
                checkbox
                inheritNode={fiscalLock ? null : inheritTag("mostrarDatosFiscales")}
                inherited={!fiscalLock && inherited("mostrarDatosFiscales")}
              >
                <label className="config-checkbox">
                  <input
                    type="checkbox"
                    checked={fiscalLock ? true : !!val("mostrarDatosFiscales")}
                    onChange={(e) => setVal("mostrarDatosFiscales", e.target.checked)}
                    disabled={fiscalLock || disabledFor("mostrarDatosFiscales")}
                  />
                  Mostrar datos fiscales
                </label>
              </TdField>
              {fiscalLock && (
                <p className="print-config-note">
                  VeriFactu activo: los datos fiscales y el QR de la AEAT son obligatorios y no pueden ocultarse.
                </p>
              )}
            </fieldset>

            {/* ── QR ── */}
            <fieldset className="td-fieldset">
              <legend>QR</legend>
              <TdField checkbox inheritNode={inheritTag("qrActivo")} inherited={inherited("qrActivo")}>
                <label className="config-checkbox">
                  <input type="checkbox" checked={!!val("qrActivo")} onChange={(e) => setVal("qrActivo", e.target.checked)} disabled={disabledFor("qrActivo")} />
                  Incluir QR en el ticket
                </label>
              </TdField>
              {val("qrActivo") && (
                <TdField label="Contenido del QR (URL o texto)" inheritNode={inheritTag("qrUrl")} inherited={inherited("qrUrl")}>
                  <input
                    type="text"
                    maxLength={2000}
                    placeholder="Ej: https://tuweb.com/carta o https://g.page/tu-negocio/review"
                    value={val("qrUrl") || ""}
                    onChange={(e) => setVal("qrUrl", e.target.value)}
                    disabled={disabledFor("qrUrl")}
                  />
                </TdField>
              )}
              <p className="print-config-note">
                El QR codifica lo que escribas aquí (una URL a tu carta, tu web, tus
                reseñas de Google…). Si lo dejas vacío no se imprime ningún QR.
                No afecta al QR fiscal de la AEAT en las facturas, que es aparte.
              </p>
            </fieldset>

            {/* ── Frases al pie ── */}
            <fieldset className="td-fieldset">
              <legend>Frases al pie</legend>
              <TdField label="Mensaje de agradecimiento" inheritNode={inheritTag("mensajeAgradecimiento")} inherited={inherited("mensajeAgradecimiento")}>
                <input type="text" maxLength={200} placeholder="Ej: ¡Gracias por su visita!" value={val("mensajeAgradecimiento") || ""} onChange={(e) => setVal("mensajeAgradecimiento", e.target.value)} disabled={disabledFor("mensajeAgradecimiento")} />
              </TdField>
              <TdField label="Texto legal" inheritNode={inheritTag("pieLegal")} inherited={inherited("pieLegal")}>
                <input type="text" maxLength={300} placeholder="Vacío = texto por defecto del ticket" value={val("pieLegal") || ""} onChange={(e) => setVal("pieLegal", e.target.value)} disabled={disabledFor("pieLegal")} />
              </TdField>
            </fieldset>

            {/* ── Idioma ── */}
            <fieldset className="td-fieldset">
              <legend>Idioma</legend>
              <TdField label="Frases fijas" inheritNode={inheritTag("idioma")} inherited={inherited("idioma")}>
                <select value={val("idioma") || "es"} onChange={(e) => setVal("idioma", e.target.value)} disabled={disabledFor("idioma")}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="fr">Francés</option>
                  <option value="bilingue">Bilingüe</option>
                </select>
              </TdField>
            </fieldset>
          </div>

          {/* ── Preview ── */}
          <div className="td-preview">
            <TicketPreview
              estiloTicket={estilo}
              tipo={previewTipo}
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
          <button type="button" className="btn" onClick={onTestPrint} disabled={loading}>Imprimir prueba
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
  const [activeTab, setActiveTab] = useState("general");
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
        ...(activeTab && activeTab !== "general" ? { tipo: activeTab } : {}),
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
  }, [estiloTicket, estado, activeTab]);

  const handleSaveFromModal = useCallback(async () => {
    setSuccess(null); setError(null);
    try {
      setLoading(true);
      const patch = { "impresion.estiloTicket": estiloTicket };
      const { data: draft } = await api.post("/admin/config/versions", { patch, scope: "impresion_estilo", reason: "Cambios diseño ticket" });
      const versionId = draft?.version?.id || draft?.versionId || draft?.id;
      if (!versionId) throw new Error("No se recibió versionId del draft");
      await api.post(`/admin/config/versions/${versionId}/apply`, { reason: "Cambios diseño ticket" });
      await refreshConfig();
      setSuccess("Diseño del ticket guardado correctamente");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({ ...normalized, retryFn: handleSaveFromModal });
    } finally {
      setLoading(false);
    }
  }, [estiloTicket, refreshConfig]);

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
    if (estiloTicket.qrActivo) parts.push("QR");
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </main>
  );
}
