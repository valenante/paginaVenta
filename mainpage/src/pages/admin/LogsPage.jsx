// src/pages/superadmin/LogsPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../utils/api";
import "../../styles/LogsPage.css";

/* ============================
   🧠 Hook: debounce simple
============================ */
function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

/* ============================
   🧾 Helpers
============================ */
const isCanceled = (err) =>
  err?.name === "CanceledError" ||
  err?.code === "ERR_CANCELED" ||
  err?.message?.toLowerCase?.().includes("canceled") ||
  err?.message?.toLowerCase?.().includes("aborted");

const formatDate = (d) => {
  try {
    return d ? new Date(d).toLocaleString() : "—";
  } catch {
    return "—";
  }
};

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [nivel, setNivel] = useState(""); // INFO, WARN, ERROR
  const [search, setSearch] = useState("");
  const [tenant, setTenant] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce para no spamear backend mientras escribes
  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedTenant = useDebouncedValue(tenant, 300);

  // Cancelación + protección contra respuestas fuera de orden (race condition)
  const listAbortRef = useRef(null);
  const listReqSeq = useRef(0);

  const detailAbortRef = useRef(null);

  const closeModal = useCallback(() => {
    setSelectedId(null);
    setSelected(null);
    setDetailLoading(false);
  }, []);

  // ✅ Si cambian filtros, volver a página 1 (en cuanto el usuario toca algo)
  useEffect(() => {
    setPage(1);
  }, [nivel, search, tenant]);

  /* ============================
     🔥 Fetch lista logs (debounced + cancel)
  ============================ */
  const fetchLogs = useCallback(async () => {
    // abort request anterior
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

      const { data } = await api.get("/admin/superadmin/logs", {
        params,
        signal: controller.signal, // axios v1+
      });

      // Si llegó una respuesta vieja, la ignoramos
      if (reqId !== listReqSeq.current) return;

      setLogs(data?.logs || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      if (!isCanceled(err)) {
        console.error("❌ Error cargando logs:", err);
      }
    } finally {
      // Evita flicker si la respuesta ya no es la última
      if (reqId === listReqSeq.current) setLoading(false);
    }
  }, [page, nivel, debouncedSearch, debouncedTenant]);

  useEffect(() => {
    fetchLogs();
    return () => {
      listAbortRef.current?.abort?.();
    };
  }, [fetchLogs]);

  /* ============================
     📌 Abrir log (modal + carga detalle)
  ============================ */
  const openLog = useCallback((id) => {
    setSelectedId(id);
    setSelected(null);
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    // abort detalle anterior
    detailAbortRef.current?.abort?.();
    const controller = new AbortController();
    detailAbortRef.current = controller;

    let alive = true;

    (async () => {
      setDetailLoading(true);
      try {
        const { data } = await api.get(`/admin/superadmin/logs/${selectedId}`, {
          signal: controller.signal,
        });
        if (!alive) return;
        setSelected(data?.log || null);
      } catch (err) {
        if (!isCanceled(err)) {
          console.error("❌ Error cargando detalle del log:", err);
        }
      } finally {
        if (alive) setDetailLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [selectedId]);

  /* ============================
     🔒 Bloquear scroll + ESC cerrar
  ============================ */
  useEffect(() => {
    const isOpen = !!selectedId;
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedId, closeModal]);

  /* ============================
     ❌ Borrar todos los logs
  ============================ */
  const handleDeleteAll = useCallback(async () => {
    const reason = prompt("Motivo (mínimo 10 caracteres):");
    if (!reason || reason.trim().length < 10) {
      alert("Motivo requerido (mín. 10 caracteres).");
      return;
    }

    const confirmText = prompt('Escribe EXACTAMENTE: DELETE_ALL_LOGS');
    if (confirmText !== "DELETE_ALL_LOGS") {
      alert("Confirmación incorrecta.");
      return;
    }

    try {
      await api.delete("/admin/superadmin/logs", {
        data: { reason: reason.trim(), confirm: confirmText },
      });

      closeModal();
      setPage(1);
      // recarga lista
      fetchLogs();
      alert("Logs eliminados (se conservó el audit del borrado).");
    } catch (err) {
      console.error("❌ Error eliminando logs:", err);
      alert("No se pudieron eliminar los logs.");
    }
  }, [closeModal, fetchLogs]);

  /* ============================
     🧩 Modal (Portal)
  ============================ */
  const modal = useMemo(() => {
    if (!selectedId) return null;

    return createPortal(
      <div className="logs-modal-logsAdmin" onClick={closeModal}>
        <div
          className="logs-modal-content-logsAdmin"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Detalle del log"
        >
          <header className="logs-modal-header-logsAdmin">
            <div>
              <h2 className="logs-modal-title-logsAdmin">Detalle del Log</h2>
              <p className="logs-modal-subtitle-logsAdmin">
                ID: <span className="logs-mono-logsAdmin">{selectedId}</span>
              </p>
            </div>

            <button
              className="logs-modal-x-logsAdmin"
              onClick={closeModal}
              aria-label="Cerrar"
              type="button"
            >
              ✕
            </button>
          </header>

          {detailLoading ? (
            <div className="logs-modal-loading-logsAdmin">
              <div className="logs-skeleton-logsAdmin" />
              <div className="logs-skeleton-logsAdmin" />
              <div className="logs-skeleton-logsAdmin" />
            </div>
          ) : selected ? (
            <div className="logs-modal-body-logsAdmin">
              <section className="logs-modal-grid-logsAdmin">
                <div className="logs-kv-logsAdmin">
                  <span>Nivel</span>
                  <strong
                    className={`nivel-chip-logsAdmin nivel-${String(selected.nivel || "")
                      .toLowerCase()
                      .trim()}`}
                  >
                    {selected.nivel || "—"}
                  </strong>
                </div>

                <div className="logs-kv-logsAdmin">
                  <span>Acción</span>
                  <strong className="logs-mono-logsAdmin">
                    {selected.accion || "—"}
                  </strong>
                </div>

                <div className="logs-kv-logsAdmin">
                  <span>Tenant</span>
                  <strong>{selected.tenant || "—"}</strong>
                </div>

                <div className="logs-kv-logsAdmin">
                  <span>Fecha</span>
                  <strong>{formatDate(selected.createdAt)}</strong>
                </div>

                <div className="logs-kv-logsAdmin logs-kv-span-logsAdmin">
                  <span>Mensaje</span>
                  <strong>{selected.mensaje || "—"}</strong>
                </div>
              </section>

              <div className="logs-json-sections-logsAdmin">
                <h3>Actor</h3>
                <pre className="logs-pre-logsAdmin">
                  {JSON.stringify(selected.actor || {}, null, 2)}
                </pre>

                <h3>Contexto (ctx)</h3>
                <pre className="logs-pre-logsAdmin">
                  {JSON.stringify(selected.ctx || {}, null, 2)}
                </pre>

                <h3>Recurso</h3>
                <pre className="logs-pre-logsAdmin">
                  {JSON.stringify(selected.resource || null, null, 2)}
                </pre>

                <h3>Diferencias (diff)</h3>
                <pre className="logs-pre-logsAdmin">
                  {JSON.stringify(selected.diff || null, null, 2)}
                </pre>

                <h3>Datos adicionales</h3>
                <pre className="logs-pre-logsAdmin">
                  {JSON.stringify(selected.datos || {}, null, 2)}
                </pre>
              </div>

              <footer className="logs-modal-footer-logsAdmin">
                <button
                  className="logs-modal-close-logsAdmin"
                  onClick={closeModal}
                  type="button"
                >
                  Cerrar
                </button>
              </footer>
            </div>
          ) : (
            <p className="logs-loading-logsAdmin">No se pudo cargar el detalle.</p>
          )}
        </div>
      </div>,
      document.body
    );
  }, [selectedId, selected, detailLoading, closeModal]);

  /* ============================
     🎨 Render
  ============================ */
 return (
  <section className="logs">
    <header className="logs__header">
      <div>
        <h1 className="logs__title">🧾 Logs del Sistema</h1>
        <p className="logs__subtitle">Audita acciones, cambios y errores del panel.</p>
      </div>

      <button
        className="logs__dangerBtn"
        onClick={handleDeleteAll}
        type="button"
        title="Borrar todos los logs"
      >
        🗑️ Borrar todo
      </button>
    </header>

    {/* Filtros */}
    <div className="logs-filters" role="region" aria-label="Filtros de logs">
      <select
        className="logs-field"
        value={nivel}
        onChange={(e) => setNivel(e.target.value)}
        aria-label="Filtrar por nivel"
      >
        <option value="">Todos</option>
        <option value="INFO">INFO</option>
        <option value="WARN">WARN</option>
        <option value="ERROR">ERROR</option>
      </select>

      <input
        className="logs-field"
        type="text"
        placeholder="Buscar texto…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar en logs"
      />

      <input
        className="logs-field"
        type="text"
        placeholder="Filtrar por tenant (slug)…"
        value={tenant}
        onChange={(e) => setTenant(e.target.value)}
        aria-label="Filtrar por tenant"
      />
    </div>

    {/* Lista */}
    {loading ? (
      <p className="logs-state logs-state--muted">Cargando logs…</p>
    ) : logs.length === 0 ? (
      <p className="logs-state logs-state--muted">No hay logs.</p>
    ) : (
      <div className="logs-tableWrap">
        <table className="logs-table">
          <thead className="logs-table__thead">
            <tr>
              <th>Nivel</th>
              <th>Acción</th>
              <th>Mensaje</th>
              <th>Tenant</th>
              <th>Fecha</th>
            </tr>
          </thead>

          <tbody className="logs-table__tbody">
            {logs.map((log) => (
              <tr
                key={log._id}
                className="logs-table__row"
                onClick={() => openLog(log._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openLog(log._id);
                }}
                title="Ver detalle"
                tabIndex={0}
                role="button"
              >
                <td className="logs-table__cell" data-label="Nivel">
                  <span
                    className={`logs-level logs-level--${String(log.nivel || "")
                      .toLowerCase()
                      .trim()}`}
                  >
                    {log.nivel || "—"}
                  </span>
                </td>

                <td className="logs-table__cell logs-mono" data-label="Acción">
                  {log.accion || "—"}
                </td>

                <td
                  className="logs-table__cell logs-message"
                  data-label="Mensaje"
                  title={log.mensaje || ""}
                >
                  {log.mensaje || "—"}
                </td>

                <td className="logs-table__cell" data-label="Tenant">
                  {log.tenant || "—"}
                </td>

                <td className="logs-table__cell" data-label="Fecha">
                  {formatDate(log.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Paginación */}
    {!loading && logs.length > 0 && (
      <nav className="logs-pagination" aria-label="Paginación logs">
        <button
          className="logs-pagination__btn"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          type="button"
        >
          ← Anterior
        </button>

        <span className="logs-pagination__meta">
          Página <strong>{page}</strong> de <strong>{totalPages}</strong>
        </span>

        <button
          className="logs-pagination__btn"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          type="button"
        >
          Siguiente →
        </button>
      </nav>
    )}

    {/* Modal via portal */}
    {modal}
  </section>
);
}