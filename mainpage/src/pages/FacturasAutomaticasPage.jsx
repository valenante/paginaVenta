// src/pages/FacturasAutomaticasPage.jsx
// Panel de gestión de facturas automáticas — lectura de Gmail + procesamiento IA.

import React, { useState } from "react";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import api from "../utils/api";
import {
  useInboundJobs,
  useInboundStats,
  useGmailStatus,
  useFacturasConfig,
  aprobarJob,
  rechazarJob,
  reprocesarJob,
  getGmailAuthUrl,
  disconnectGmail,
  syncGmailNow,
  updateFacturasConfig,
  enviarGestorManual,
} from "../Hooks/useFacturasAutomaticas";
import "./FacturasAutomaticasPage.css";

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ estado }) {
  const map = {
    "received": { label: "Recibida", cls: "badge--info" },
    "classifying": { label: "Clasificando", cls: "badge--info" },
    "classified:invoice": { label: "Factura detectada", cls: "badge--info" },
    "classified:other": { label: "No es factura", cls: "badge--muted" },
    "classified:spam": { label: "Spam", cls: "badge--muted" },
    "extracting": { label: "Extrayendo datos", cls: "badge--info" },
    "extracted": { label: "Datos extraídos", cls: "badge--info" },
    "matching": { label: "Buscando proveedor", cls: "badge--info" },
    "matched": { label: "Proveedor encontrado", cls: "badge--info" },
    "pending_review": { label: "Pendiente revisión", cls: "badge--warn" },
    "completed:auto": { label: "Auto-aprobada", cls: "badge--ok" },
    "completed:manual": { label: "Aprobada", cls: "badge--ok" },
    "failed": { label: "Error", cls: "badge--error" },
    "rejected": { label: "Rechazada", cls: "badge--muted" },
    "rejected:duplicate": { label: "Duplicada", cls: "badge--muted" },
  };
  const { label, cls } = map[estado] || { label: estado, cls: "badge--muted" };
  return <span className={`finv-badge ${cls}`}>{label}</span>;
}

// ── Job detail modal ───────────────────────────────────────
function JobDetail({ job, onClose, onAction }) {
  if (!job) return null;
  const datos = job.datosExtraidos || {};
  const emisor = datos.emisor || {};

  return (
    <div className="finv-overlay" onClick={onClose}>
      <div className="finv-modal" onClick={e => e.stopPropagation()}>
        <div className="finv-modal__header">
          <h3>Factura {datos.numeroFactura || "(sin número)"}</h3>
          <button className="finv-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="finv-modal__body">
          {/* Emisor */}
          <div className="finv-modal__section">
            <h4>Proveedor detectado</h4>
            <div className="finv-modal__grid2">
              <div><strong>Nombre:</strong> {emisor.nombre || "—"}</div>
              <div><strong>CIF:</strong> {emisor.nif || "—"}</div>
              <div><strong>Dirección:</strong> {emisor.direccion || "—"}</div>
              <div><strong>Match:</strong> {job.matchProveedor?.metodo || "none"} ({Math.round((job.matchProveedor?.confianza || 0) * 100)}%)</div>
            </div>
          </div>

          {/* Datos factura */}
          <div className="finv-modal__section">
            <h4>Datos de factura</h4>
            <div className="finv-modal__grid2">
              <div><strong>Nº Factura:</strong> {datos.numeroFactura || "—"}</div>
              <div><strong>Fecha:</strong> {datos.fechaFactura ? new Date(datos.fechaFactura).toLocaleDateString("es") : "—"}</div>
              <div><strong>Total:</strong> {(datos.total || 0).toFixed(2)}€</div>
              <div><strong>IVA:</strong> {(datos.totalIva || 0).toFixed(2)}€</div>
            </div>
          </div>

          {/* Líneas */}
          <div className="finv-modal__section">
            <h4>Líneas ({(datos.lineas || []).length})</h4>
            <div className="finv-modal__table">
              <div className="finv-modal__table-head">
                <span>Producto factura</span>
                <span>Cant.</span>
                <span>Precio</span>
                <span>Match</span>
                <span>Producto carta</span>
                <span>Stock</span>
              </div>
              {(datos.lineas || []).map((l, i) => (
                <div key={i} className={`finv-modal__table-row ${l.precioCambio ? "finv-modal__table-row--price-change" : ""}`}>
                  <span className="finv-modal__prod-name">{l.descripcion}</span>
                  <span>{l.cantidad} {l.unidad}</span>
                  <span>{(l.precioUnitario || 0).toFixed(2)}€ <span style={{color:"#64748b",fontSize:"0.7rem"}}>{l.iva}%</span></span>
                  <span>
                    {l.matchEstado === "auto" && <span className="finv-badge badge--ok">Auto</span>}
                    {l.matchEstado === "sugerido" && <span className="finv-badge badge--warn">Sugerido</span>}
                    {l.matchEstado === "nuevo" && <span className="finv-badge badge--info">Nuevo</span>}
                    {l.matchEstado === "pendiente" && <span className="finv-badge badge--muted">—</span>}
                    {l.precioCambio && <span className="finv-price-change">⚠ {l.precioAnterior?.toFixed(2)}→{l.precioUnitario?.toFixed(2)}€</span>}
                  </span>
                  <span style={{fontWeight:600, color: l._stockPreview ? "#e2e8f0" : "#64748b"}}>
                    {l._stockPreview ? l._stockPreview.productoNombre : "—"}
                  </span>
                  <span>
                    {l._stockPreview ? (
                      <span style={{fontSize:"0.75rem"}}>
                        <span style={{color:"#64748b"}}>{l._stockPreview.stockActual}</span>
                        <span style={{color:"#22c55e", fontWeight:700}}> +{l._stockPreview.deltaStock}</span>
                        <span style={{color:"#64748b"}}> → {l._stockPreview.stockNuevo}</span>
                      </span>
                    ) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Adjuntos */}
          {job.attachments?.length > 0 && (
            <div className="finv-modal__section">
              <h4>Adjuntos</h4>
              <div className="finv-modal__attachments">
                {job.attachments.map((a, i) => (
                  <a key={i} href={a.r2Url} target="_blank" rel="noopener noreferrer" className="finv-modal__attachment">
                    📎 {a.originalFilename} ({(a.sizeBytes / 1024).toFixed(0)}KB)
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Errores */}
          {job.errores?.length > 0 && (
            <div className="finv-modal__section">
              <h4>Errores</h4>
              {job.errores.map((e, i) => (
                <div key={i} className="finv-modal__error">{e.etapa}: {e.mensaje}</div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {(job.estado === "pending_review" || job.estado === "failed") && (
          <div className="finv-modal__footer">
            {job.estado === "pending_review" && (
              <>
                <button className="sug-btn sug-btn--secondary" onClick={() => onAction("rechazar", job._id)}>Rechazar</button>
                <button className="sug-btn sug-btn--primary" onClick={() => onAction("aprobar", job._id)}>Aprobar factura</button>
              </>
            )}
            {job.estado === "failed" && (
              <button className="sug-btn sug-btn--primary" onClick={() => onAction("reprocesar", job._id)}>Reprocesar</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function FacturasAutomaticasPage() {
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [msg, setMsg] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [enviandoGestor, setEnviandoGestor] = useState(false);
  const [gestorExpanded, setGestorExpanded] = useState(false);

  const estadoFilter = tab === "pending" ? "pending_review" : tab === "completed" ? "" : "";
  const { items, total, pages, loading, refetch } = useInboundJobs({ estado: estadoFilter, page });
  const stats = useInboundStats();
  const gmail = useGmailStatus();
  const facturasConfig = useFacturasConfig();
  const gc = facturasConfig.config; // shortcut

  const handleToggleAutoAprobar = async () => {
    try {
      await updateFacturasConfig({ autoAprobar: !gc.autoAprobar });
      facturasConfig.refetch();
      setMsg({ t: "ok", m: gc.autoAprobar ? "Auto-aprobación desactivada" : "Auto-aprobación activada" });
    } catch { setMsg({ t: "error", m: "Error al actualizar config" }); }
  };

  // ── Gestor handlers ──
  const handleGestorFieldChange = async (field, value) => {
    try {
      await updateFacturasConfig({ [field]: value });
      facturasConfig.refetch();
    } catch { setMsg({ t: "error", m: "Error al guardar" }); }
  };

  const handleToggleGestorActivo = async () => {
    if (!gc.envioGestorActivo && !gc.gestorEmail) {
      setMsg({ t: "error", m: "Configura el email del gestor antes de activar" });
      return;
    }
    try {
      await updateFacturasConfig({ envioGestorActivo: !gc.envioGestorActivo });
      facturasConfig.refetch();
      setMsg({ t: "ok", m: gc.envioGestorActivo ? "Envío al gestor desactivado" : "Envío al gestor activado" });
    } catch { setMsg({ t: "error", m: "Error al actualizar config" }); }
  };

  const handleEnviarGestorAhora = async () => {
    if (!gc.gestorEmail) {
      setMsg({ t: "error", m: "Configura el email del gestor primero" });
      return;
    }
    setEnviandoGestor(true);
    try {
      const result = await enviarGestorManual();
      if (result.enviadas > 0) {
        setMsg({ t: "ok", m: `${result.enviadas} factura${result.enviadas !== 1 ? "s" : ""} enviada${result.enviadas !== 1 ? "s" : ""} a ${result.emailTo}` });
      } else {
        setMsg({ t: "ok", m: result.mensaje || "No hay facturas en el periodo" });
      }
    } catch (err) {
      setMsg({ t: "error", m: err?.response?.data?.message || "Error al enviar" });
    } finally {
      setEnviandoGestor(false);
    }
  };

  const handleGestorEmailBlur = async (e) => {
    const email = e.target.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg({ t: "error", m: "Email del gestor no válido" });
      return;
    }
    await handleGestorFieldChange("gestorEmail", email);
  };

  const handleConnectGmail = async () => {
    try {
      const url = await getGmailAuthUrl();
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setMsg({ t: "error", m: err?.response?.data?.message || "Error" });
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await disconnectGmail();
      gmail.refetch();
      setMsg({ t: "ok", m: "Gmail desconectado" });
    } catch (err) {
      setMsg({ t: "error", m: "Error al desconectar" });
    }
    setConfirmAction(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncGmailNow();
      setMsg({ t: "ok", m: `Sync completado: ${result.created} facturas nuevas encontradas` });
      refetch();
      stats.refetch();
    } catch (err) {
      setMsg({ t: "error", m: err?.response?.data?.message || "Error al sincronizar" });
    } finally {
      setSyncing(false);
    }
  };

  const handleAction = async (action, jobId) => {
    try {
      if (action === "aprobar") await aprobarJob(jobId);
      else if (action === "rechazar") await rechazarJob(jobId, "Rechazada manualmente");
      else if (action === "reprocesar") await reprocesarJob(jobId);
      setMsg({ t: "ok", m: action === "aprobar" ? "Factura aprobada" : action === "rechazar" ? "Factura rechazada" : "Reprocesando..." });
      setSelectedJob(null);
      refetch();
      stats.refetch();
    } catch (err) {
      setMsg({ t: "error", m: err?.response?.data?.message || "Error" });
    }
  };

  const filteredItems = tab === "all" ? items : items;

  return (
    <div className="sug-root">
      {/* Header */}
      <div className="sug-header">
        <div>
          <h2>Facturas automáticas</h2>
          <p className="sug-header__sub">ALEF lee las facturas de tu email y las procesa automáticamente.</p>
        </div>
        {gmail.connected && <span className="sug-header__badge sug-header__badge--on">Conectado</span>}
      </div>

      {msg && (
        <div className={`sug-toast sug-toast--${msg.t === "ok" ? "ok" : "error"}`}>
          {msg.m}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
        </div>
      )}

      {/* Gmail connection */}
      <div className="sug-section">
        <div className="sug-toggle-row">
          <div>
            <span className="sug-toggle-label">Conexión Gmail</span>
            <span className="sug-toggle-desc">
              {gmail.connected
                ? `Conectado a ${gmail.emailAddress || "—"}. Última sincronización: ${gmail.lastSyncAt ? new Date(gmail.lastSyncAt).toLocaleString("es") : "nunca"}`
                : "Conecta el email del restaurante para que ALEF lea las facturas automáticamente."}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {gmail.connected ? (
              <>
                <button className="sug-btn sug-btn--primary" onClick={handleSync} disabled={syncing}>
                  {syncing ? "Sincronizando..." : "Sincronizar ahora"}
                </button>
                <button className="sug-btn sug-btn--secondary" onClick={() => setConfirmAction("disconnect")}>
                  Desconectar
                </button>
              </>
            ) : (
              <button className="sug-btn sug-btn--primary" onClick={handleConnectGmail}>
                Conectar Gmail
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-aprobación */}
      <div className="sug-section">
        <div className="sug-toggle-row">
          <div>
            <span className="sug-toggle-label">Auto-aprobación + stock</span>
            <span className="sug-toggle-desc">
              {gc.autoAprobar
                ? "Las facturas con alta confianza se aprueban automáticamente y actualizan el stock."
                : "Las facturas requieren revisión manual antes de actualizar stock y costes."}
            </span>
          </div>
          <button
            className={`sug-toggle ${gc.autoAprobar ? "sug-toggle--on" : ""}`}
            onClick={handleToggleAutoAprobar}
          >
            <span className="sug-toggle__knob" />
          </button>
        </div>
      </div>

      {/* ── Envío al gestor ── */}
      <div className="sug-section">
        <div className="sug-toggle-row">
          <div>
            <span className="sug-toggle-label">Envío automático al gestor</span>
            <span className="sug-toggle-desc">
              {gc.envioGestorActivo
                ? `Las facturas se envían ${gc.envioGestorFreq === "diario" ? "cada día" : gc.envioGestorFreq === "semanal" ? "cada semana" : "cada mes"} a ${gc.gestorEmail || "—"}`
                : "Envía automáticamente un resumen con todas las facturas a tu gestoría o asesoría."}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="finv-gestor__expand"
              onClick={() => setGestorExpanded(!gestorExpanded)}
              title="Configurar"
            >
              {gestorExpanded ? "▲" : "▼"}
            </button>
            <button
              className={`sug-toggle ${gc.envioGestorActivo ? "sug-toggle--on" : ""}`}
              onClick={handleToggleGestorActivo}
            >
              <span className="sug-toggle__knob" />
            </button>
          </div>
        </div>

        {gestorExpanded && (
          <div className="finv-gestor">
            {/* Email gestor */}
            <div className="finv-gestor__field">
              <label className="finv-gestor__label">Email del gestor / asesoría</label>
              <input
                type="email"
                className="finv-gestor__input"
                placeholder="gestor@asesoria.com"
                defaultValue={gc.gestorEmail || ""}
                onBlur={handleGestorEmailBlur}
              />
            </div>

            {/* Frecuencia */}
            <div className="finv-gestor__row">
              <div className="finv-gestor__field finv-gestor__field--flex">
                <label className="finv-gestor__label">Frecuencia</label>
                <div className="finv-gestor__chips">
                  {[
                    { value: "diario", label: "Diario" },
                    { value: "semanal", label: "Semanal" },
                    { value: "mensual", label: "Mensual" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`finv-gestor__chip ${(gc.envioGestorFreq || "semanal") === opt.value ? "finv-gestor__chip--active" : ""}`}
                      onClick={() => handleGestorFieldChange("envioGestorFreq", opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="finv-gestor__field">
                <label className="finv-gestor__label">Hora de envío</label>
                <select
                  className="finv-gestor__select"
                  value={gc.envioGestorHora || "08:00"}
                  onChange={e => handleGestorFieldChange("envioGestorHora", e.target.value)}
                >
                  {Array.from({ length: 24 }, (_, h) => {
                    const hh = String(h).padStart(2, "0");
                    return <option key={h} value={`${hh}:00`}>{hh}:00</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Día de semana / mes (condicional) */}
            {(gc.envioGestorFreq || "semanal") === "semanal" && (
              <div className="finv-gestor__field">
                <label className="finv-gestor__label">Día de la semana</label>
                <div className="finv-gestor__chips">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d, i) => (
                    <button
                      key={i}
                      className={`finv-gestor__chip finv-gestor__chip--sm ${(gc.envioGestorDiaSemana ?? 1) === i ? "finv-gestor__chip--active" : ""}`}
                      onClick={() => handleGestorFieldChange("envioGestorDiaSemana", i)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(gc.envioGestorFreq || "semanal") === "mensual" && (
              <div className="finv-gestor__field">
                <label className="finv-gestor__label">Día del mes</label>
                <select
                  className="finv-gestor__select"
                  value={gc.envioGestorDiaMes ?? 1}
                  onChange={e => handleGestorFieldChange("envioGestorDiaMes", Number(e.target.value))}
                >
                  {Array.from({ length: 28 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Último envío + botón manual */}
            <div className="finv-gestor__footer">
              <span className="finv-gestor__last">
                {gc.ultimoEnvioGestor
                  ? `Último envío: ${new Date(gc.ultimoEnvioGestor).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                  : "Aún no se ha enviado ningún resumen"}
              </span>
              <button
                className="sug-btn sug-btn--primary"
                onClick={handleEnviarGestorAhora}
                disabled={enviandoGestor || !gc.gestorEmail}
              >
                {enviandoGestor ? "Enviando..." : "Enviar ahora"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="finv-stats">
        <div className="finv-stat">
          <span className="finv-stat__value finv-stat__value--warn">{stats.pending}</span>
          <span className="finv-stat__label">Pendientes</span>
        </div>
        <div className="finv-stat">
          <span className="finv-stat__value finv-stat__value--ok">{stats.completedMonth}</span>
          <span className="finv-stat__label">Este mes</span>
        </div>
        <div className="finv-stat">
          <span className="finv-stat__value">{stats.totalProcessed}</span>
          <span className="finv-stat__label">Total procesadas</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sug-tabs">
        {[
          { key: "pending", label: `Pendientes (${stats.pending})` },
          { key: "all", label: "Todas" },
        ].map(t => (
          <button
            key={t.key}
            className={`sug-tab-btn ${tab === t.key ? "sug-tab-btn--active" : ""}`}
            onClick={() => { setTab(t.key); setPage(1); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="sug-section">
        {loading ? (
          <div className="sug-loading">Cargando facturas...</div>
        ) : filteredItems.length === 0 ? (
          <div className="sug-empty">
            {tab === "pending" ? "No hay facturas pendientes de revisión" : "No hay facturas procesadas"}
          </div>
        ) : (
          <div className="finv-list">
            <div className="finv-list__head">
              <span>Fecha</span>
              <span>Proveedor</span>
              <span>Nº Factura</span>
              <span>Total</span>
              <span>Estado</span>
            </div>
            {filteredItems.map(job => (
              <button key={job._id} className="finv-list__row" onClick={async () => {
                try {
                  const { data } = await api.get(`/admin/facturas-automaticas/${job._id}`);
                  setSelectedJob(data.job);
                } catch { setSelectedJob(job); }
              }}>
                <span>{new Date(job.createdAt).toLocaleDateString("es")}</span>
                <span className="finv-list__prov">
                  {job.datosExtraidos?.emisor?.nombre || job.emailFrom || "—"}
                </span>
                <span>{job.datosExtraidos?.numeroFactura || "—"}</span>
                <span>{(job.datosExtraidos?.total || 0).toFixed(2)}€</span>
                <span><StatusBadge estado={job.estado} /></span>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="finv-pagination">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                className={`finv-pagination__btn ${page === i + 1 ? "finv-pagination__btn--active" : ""}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Job detail modal */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onAction={handleAction}
        />
      )}

      {/* Confirm disconnect */}
      {confirmAction === "disconnect" && (
        <ModalConfirmacion
          titulo="Desconectar Gmail"
          mensaje="Se dejará de leer el email automáticamente. ¿Continuar?"
          onConfirm={handleDisconnectGmail}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
