// src/pages/admin/LogsPage.jsx — Rediseñado v2
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiFileText, FiAlertTriangle, FiFilter, FiDownload, FiTrash2, FiX, FiSearch } from "react-icons/fi";
import api from "../../utils/api";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../context/ToastContext";
import "../../styles/LogsPage.css";

/* ── Helpers ───────────────────────── */
function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delayMs); return () => clearTimeout(t); }, [value, delayMs]);
  return debounced;
}
const isCanceled = (err) => err?.name === "CanceledError" || err?.code === "ERR_CANCELED";
const fmt = (d) => { try { return d ? new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"; } catch { return "—"; } };

const CATEGORIES = {
  auth: { label: "Auth", match: (a) => a?.startsWith("auth.") },
  pedidos: { label: "Pedidos", match: (a) => a?.startsWith("pedidos.") || a?.startsWith("bebidas.") },
  admin: { label: "Admin", match: (a) => a?.startsWith("tenant.") || a?.startsWith("emergency.") || a?.startsWith("incident.") },
  system: { label: "Sistema", match: (a) => a?.startsWith("system.") || a?.startsWith("export.") || a?.startsWith("rgpd.") },
};

function categorize(accion) {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.match(accion)) return key;
  }
  return "other";
}

export default function LogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [nivel, setNivel] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [tenant, setTenant] = useState("");
  const [hideSmoke, setHideSmoke] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedTenant = useDebouncedValue(tenant, 300);
  const listAbortRef = useRef(null);
  const listReqSeq = useRef(0);
  const detailAbortRef = useRef(null);

  const closeModal = useCallback(() => { setSelectedId(null); setSelected(null); setDetailLoading(false); }, []);

  useEffect(() => { setPage(1); }, [nivel, search, tenant, category, hideSmoke]);

  /* ── Fetch logs ──────────────────── */
  const fetchLogs = useCallback(async () => {
    listAbortRef.current?.abort?.();
    const controller = new AbortController();
    listAbortRef.current = controller;
    const reqId = ++listReqSeq.current;
    setLoading(true);

    try {
      const params = { page, limit: 50 };
      if (nivel) params.nivel = nivel;
      if (debouncedSearch) params.search = debouncedSearch;
      if (debouncedTenant) params.tenant = debouncedTenant;

      const { data } = await api.get("/admin/superadmin/logs", { params, signal: controller.signal });
      if (reqId !== listReqSeq.current) return;

      let items = data?.logs || [];

      // Client-side filters
      if (hideSmoke) items = items.filter(l => l.tenant !== "__smoke__" && l.tenant !== "__smoke2__");
      if (category) items = items.filter(l => categorize(l.accion) === category);

      setLogs(items);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      if (!isCanceled(err)) showToast("Error cargando logs", "error");
    } finally {
      if (reqId === listReqSeq.current) setLoading(false);
    }
  }, [page, nivel, debouncedSearch, debouncedTenant, category, hideSmoke, showToast]);

  useEffect(() => { fetchLogs(); return () => listAbortRef.current?.abort?.(); }, [fetchLogs]);

  /* ── Detalle modal ───────────────── */
  const openLog = useCallback((id) => { setSelectedId(id); setSelected(null); }, []);

  useEffect(() => {
    if (!selectedId) return;
    detailAbortRef.current?.abort?.();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    let alive = true;
    (async () => {
      setDetailLoading(true);
      try {
        const { data } = await api.get(`/admin/superadmin/logs/${selectedId}`, { signal: controller.signal });
        if (alive) setSelected(data?.log || null);
      } catch (err) { if (!isCanceled(err)) showToast("Error cargando detalle", "error"); }
      finally { if (alive) setDetailLoading(false); }
    })();
    return () => { alive = false; controller.abort(); };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [selectedId, closeModal]);

  /* ── Error summary ───────────────── */
  const errorSummary = useMemo(() => {
    const errors = logs.filter(l => l.nivel === "ERROR");
    const grouped = {};
    for (const e of errors) {
      const key = e.accion || "unknown";
      if (!grouped[key]) grouped[key] = { accion: key, count: 0, lastMsg: e.mensaje, lastDate: e.createdAt, tenant: e.tenant };
      grouped[key].count++;
      if (new Date(e.createdAt) > new Date(grouped[key].lastDate)) {
        grouped[key].lastDate = e.createdAt;
        grouped[key].lastMsg = e.mensaje;
      }
    }
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [logs]);

  /* ── Export CSV ──────────────────── */
  const exportCSV = () => {
    const header = "Nivel,Acción,Mensaje,Tenant,Fecha\n";
    const rows = logs.map(l =>
      `${l.nivel},"${(l.accion || "").replace(/"/g, '""')}","${(l.mensaje || "").replace(/"/g, '""')}",${l.tenant || ""},${fmt(l.createdAt)}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `alef-logs-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Delete all ──────────────────── */
  const handleDeleteAll = useCallback(async () => {
    const reason = prompt("Motivo (mínimo 10 caracteres):");
    if (!reason || reason.trim().length < 10) { showToast("Motivo requerido (mín. 10 caracteres).", "aviso"); return; }
    const confirmText = prompt('Escribe EXACTAMENTE: DELETE_ALL_LOGS');
    if (confirmText !== "DELETE_ALL_LOGS") { showToast("Confirmación incorrecta.", "aviso"); return; }
    try {
      await api.delete("/admin/superadmin/logs", { data: { reason: reason.trim(), confirm: confirmText } });
      closeModal(); setPage(1); fetchLogs();
      showToast("Logs eliminados.", "exito");
    } catch { showToast("No se pudieron eliminar.", "error"); }
  }, [closeModal, fetchLogs]);

  /* ── Modal ───────────────────────── */
  const modal = useMemo(() => {
    if (!selectedId) return null;
    return createPortal(
      <div className="logs-overlay" onClick={closeModal}>
        <div className="logs-modal" onClick={e => e.stopPropagation()} role="dialog">
          <div className="logs-modal__head">
            <h2>Detalle del Log</h2>
            <button className="logs-modal__close" onClick={closeModal}><FiX /></button>
          </div>
          {detailLoading ? <div className="logs-modal__loading">Cargando...</div> : selected ? (
            <div className="logs-modal__body">
              <div className="logs-modal__grid">
                <div><span className="logs-modal__label">Nivel</span><span className={`logs-level logs-level--${(selected.nivel || "").toLowerCase()}`}>{selected.nivel}</span></div>
                <div><span className="logs-modal__label">Acción</span><code>{selected.accion}</code></div>
                <div><span className="logs-modal__label">Tenant</span><span>{selected.tenant || "—"}</span></div>
                <div><span className="logs-modal__label">Fecha</span><span>{fmt(selected.createdAt)}</span></div>
              </div>
              <div className="logs-modal__msg"><span className="logs-modal__label">Mensaje</span><p>{selected.mensaje || "—"}</p></div>
              {selected.actor && <div className="logs-modal__section"><h4>Actor</h4><pre>{JSON.stringify(selected.actor, null, 2)}</pre></div>}
              {selected.ctx && Object.keys(selected.ctx).length > 0 && <div className="logs-modal__section"><h4>Contexto</h4><pre>{JSON.stringify(selected.ctx, null, 2)}</pre></div>}
              {selected.datos && Object.keys(selected.datos).length > 0 && <div className="logs-modal__section"><h4>Datos</h4><pre>{JSON.stringify(selected.datos, null, 2)}</pre></div>}
            </div>
          ) : <div className="logs-modal__loading">No se pudo cargar.</div>}
        </div>
      </div>,
      document.body
    );
  }, [selectedId, selected, detailLoading, closeModal]);

  /* ── Render ──────────────────────── */
  return (
    <section className="logs-page">
      <header className="logs-page__head">
        <div>
          <h1>Logs del Sistema</h1>
          <p>Auditoría de acciones, errores y eventos.</p>
        </div>
        <div className="logs-page__actions">
          <button className="logs-btn" onClick={exportCSV} title="Exportar CSV"><FiDownload /> CSV</button>
          <button className="logs-btn logs-btn--danger" onClick={handleDeleteAll} title="Borrar todo"><FiTrash2 /></button>
        </div>
      </header>

      {/* Error summary */}
      {errorSummary.length > 0 && (
        <div className="logs-errors-summary">
          <h3><FiAlertTriangle /> Errores en esta página ({errorSummary.reduce((s, e) => s + e.count, 0)})</h3>
          <div className="logs-errors-list">
            {errorSummary.slice(0, 5).map(e => (
              <div key={e.accion} className="logs-error-row">
                <code>{e.accion}</code>
                <span className="logs-error-count">×{e.count}</span>
                <span className="logs-error-msg">{(e.lastMsg || "").slice(0, 60)}</span>
                <span className="logs-error-tenant">{e.tenant || "global"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="logs-filters">
        <div className="logs-filters__row">
          <select className="logs-field" value={nivel} onChange={e => setNivel(e.target.value)}>
            <option value="">Todos los niveles</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
          </select>
          <select className="logs-field" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            <option value="other">Otro</option>
          </select>
          <div className="logs-field logs-field--search">
            <FiSearch className="logs-field__icon" />
            <input type="text" placeholder="Buscar texto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input className="logs-field" type="text" placeholder="Tenant slug..." value={tenant} onChange={e => setTenant(e.target.value)} />
          <label className="logs-toggle">
            <input type="checkbox" checked={hideSmoke} onChange={e => setHideSmoke(e.target.checked)} />
            <span>Ocultar smoke tests</span>
          </label>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="logs-empty">Cargando...</div>
      ) : logs.length === 0 ? (
        <EmptyState icon={FiFileText} title="Sin registros" description="No hay logs que coincidan con los filtros." />
      ) : (
        <div className="logs-table-wrap">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Cat.</th>
                <th>Acción</th>
                <th>Mensaje</th>
                <th>Tenant</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const cat = categorize(log.accion);
                return (
                  <tr key={log._id} className="logs-row" onClick={() => openLog(log._id)} tabIndex={0}>
                    <td><span className={`logs-level logs-level--${(log.nivel || "").toLowerCase()}`}>{log.nivel}</span></td>
                    <td><span className={`logs-cat logs-cat--${cat}`}>{CATEGORIES[cat]?.label || "Otro"}</span></td>
                    <td><code className="logs-mono">{log.accion || "—"}</code></td>
                    <td className="logs-msg" title={log.mensaje}>{log.mensaje || "—"}</td>
                    <td>{log.tenant || "—"}</td>
                    <td className="logs-date">{fmt(log.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && logs.length > 0 && (
        <nav className="logs-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span>Página <strong>{page}</strong> de <strong>{totalPages}</strong></span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </nav>
      )}

      {modal}
    </section>
  );
}
