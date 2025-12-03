import { useEffect, useState } from "react";
import api from "../../utils/api";
import "../../styles/LogsPage.css";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [nivel, setNivel] = useState("");       // INFO, WARN, ERROR
  const [search, setSearch] = useState("");
  const [tenant, setTenant] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
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

      const { data } = await api.get("/superadmin/logs", { params });

      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("❌ Error cargando logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [nivel, search, tenant]);

  // ============================
  // ❌ Borrar todos los logs
  // ============================
  const handleDeleteAll = async () => {
    if (!confirm("¿Seguro que quieres eliminar TODOS los logs?")) return;

    try {
      await api.delete("/superadmin/logs");
      fetchLogs();
      alert("Logs eliminados.");
    } catch (err) {
      console.error("❌ Error eliminando logs:", err);
      alert("No se pudieron eliminar los logs.");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [nivel, search, tenant, page]);


  // ============================
  // 🎨 Render
  // ============================
  return (
    <div className="logs-page-logsAdmin">
      <h1 className="logs-title-logsAdmin">🧾 Logs del Sistema</h1>

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

        <button className="logs-delete-btn-logsAdmin" onClick={handleDeleteAll}>
          🗑️ Borrar todo
        </button>
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
                  onClick={() => setSelected(log)}
                >
                  <td className={`logs-nivel-logsAdmin nivel-${log.nivel.toLowerCase()}`}>
                    {log.nivel}
                  </td>
                  <td>{log.accion}</td>
                  <td className="logs-mensaje-logsAdmin">{log.mensaje}</td>
                  <td>{log.tenant || "—"}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="logs-pagination-logsAdmin">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Anterior
          </button>

          <span>Página {page} de {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* ===== MODAL DE DETALLES ===== */}
      {selected && (
        <div className="logs-modal-logsAdmin" onClick={() => setSelected(null)}>
          <div
            className="logs-modal-content-logsAdmin"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Detalle del Log</h2>

            <p><strong>Nivel:</strong> {selected.nivel}</p>
            <p><strong>Acción:</strong> {selected.accion}</p>
            <p><strong>Mensaje:</strong> {selected.mensaje}</p>
            <p><strong>Tenant:</strong> {selected.tenant || "—"}</p>

            <h3>Datos adicionales</h3>
            <pre className="logs-pre-logsAdmin">
              {JSON.stringify(selected.datos, null, 2)}
            </pre>

            <button
              className="logs-modal-close-logsAdmin"
              onClick={() => setSelected(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
