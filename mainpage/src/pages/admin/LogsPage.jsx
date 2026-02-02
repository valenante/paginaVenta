// src/pages/superadmin/LogsPage.jsx (o tu ruta real)
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../utils/api";
import "../../styles/LogsPage.css";

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

  // ============================
  // 🔥 Cargar logs desde backend
  // ============================
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (nivel) params.nivel = nivel;
      if (search) params.search = search;
      if (tenant) params.tenant = tenant;

      const { data } = await api.get("/admin/superadmin/logs", { params });
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("❌ Error cargando logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Si cambian filtros, volvemos a página 1
  useEffect(() => {
    setPage(1);
  }, [nivel, search, tenant]);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivel, search, tenant, page]);

  // ============================
  // 📌 Abrir log (portal + carga detalle)
  // ============================
  const openLog = (id) => {
    setSelectedId(id);
    setSelected(null); // limpiamos detalle anterior
  };

  useEffect(() => {
    if (!selectedId) return;

    let alive = true;
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const { data } = await api.get(`/admin/superadmin/logs/${selectedId}`);
        if (!alive) return;
        setSelected(data.log);
      } catch (err) {
        console.error("❌ Error cargando detalle del log:", err);
      } finally {
        if (alive) setDetailLoading(false);
      }
    };

    loadDetail();
    return () => {
      alive = false;
    };
  }, [selectedId]);

  // ============================
  // 🔒 Bloquear scroll + ESC para cerrar
  // ============================
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const closeModal = () => {
    setSelectedId(null);
    setSelected(null);
    setDetailLoading(false);
  };

  // ============================
  // ❌ Borrar todos los logs
  // ============================
  const handleDeleteAll = async () => {
    if (!confirm("¿Seguro que quieres eliminar TODOS los logs?")) return;

    try {
      await api.delete("/admin/superadmin/logs");
      closeModal();
      setPage(1);
      await fetchLogs();
      alert("Logs eliminados.");
    } catch (err) {
      console.error("❌ Error eliminando logs:", err);
      alert("No se pudieron eliminar los logs.");
    }
  };

  // ============================
  // 🧩 Modal (Portal)
  // ============================
  const modal = selectedId
    ? createPortal(
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
                    <strong className={`nivel-chip-logsAdmin nivel-${(selected.nivel || "").toLowerCase()}`}>
                      {selected.nivel || "—"}
                    </strong>
                  </div>

                  <div className="logs-kv-logsAdmin">
                    <span>Acción</span>
                    <strong className="logs-mono-logsAdmin">{selected.accion || "—"}</strong>
                  </div>

                  <div className="logs-kv-logsAdmin">
                    <span>Tenant</span>
                    <strong>{selected.tenant || "—"}</strong>
                  </div>

                  <div className="logs-kv-logsAdmin">
                    <span>Fecha</span>
                    <strong>
                      {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
                    </strong>
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
                  <button className="logs-modal-close-logsAdmin" onClick={closeModal}>
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
      )
    : null;

  // ============================
  // 🎨 Render
  // ============================
  return (
    <div className="logs-page-logsAdmin">
      <div className="logs-header-logsAdmin">
        <div>
          <h1 className="logs-title-logsAdmin">🧾 Logs del Sistema</h1>
          <p className="logs-subtitle-logsAdmin">
            Audita acciones, cambios y errores del panel.
          </p>
        </div>

        <button className="logs-delete-btn-logsAdmin" onClick={handleDeleteAll}>
          🗑️ Borrar todo
        </button>
      </div>

      {/* ===== FILTROS ===== */}
      <div className="logs-filtros-logsAdmin">
        <select
          className="logs-select-logsAdmin"
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>

        <input
          className="logs-input-logsAdmin"
          type="text"
          placeholder="Buscar texto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          className="logs-input-logsAdmin"
          type="text"
          placeholder="Filtrar por tenant (slug)..."
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />
      </div>

      {/* ===== TABLA ===== */}
      {loading ? (
        <p className="logs-loading-logsAdmin">Cargando logs...</p>
      ) : logs.length === 0 ? (
        <p className="logs-empty-logsAdmin">No hay logs.</p>
      ) : (
        <div className="logs-table-wrapper-logsAdmin">
          <table className="logs-table-logsAdmin">
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Acción</th>
                <th>Mensaje</th>
                <th>Tenant</th>
                <th>Fecha</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr
                  key={log._id}
                  className="logs-row-logsAdmin"
                  onClick={() => openLog(log._id)}
                  title="Ver detalle"
                >
                  <td>
                    <span className={`logs-nivel-logsAdmin nivel-${(log.nivel || "").toLowerCase()}`}>
                      {log.nivel || "—"}
                    </span>
                  </td>
                  <td className="logs-mono-logsAdmin">{log.accion || "—"}</td>
                  <td className="logs-mensaje-logsAdmin" title={log.mensaje || ""}>
                    {log.mensaje || "—"}
                  </td>
                  <td>{log.tenant || "—"}</td>
                  <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="logs-pagination-logsAdmin">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </button>

          <span>
            Página {page} de {totalPages}
          </span>

          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente →
          </button>
        </div>
      )}

      {/* ✅ Portal del modal */}
      {modal}
    </div>
  );
}
