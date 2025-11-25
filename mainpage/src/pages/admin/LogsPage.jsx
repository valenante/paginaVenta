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

  // ============================
  // 🔥 Cargar logs desde backend
  // ============================
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};

      if (nivel) params.nivel = nivel;
      if (search) params.search = search;
      if (tenant) params.tenant = tenant;

      const { data } = await api.get("/superadmin/logs", { params });
      setLogs(data.logs || []);
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

  // ============================
  // 🎨 Render
  // ============================
  return (
    <div className="logs-page">
      <h1>🧾 Logs del Sistema</h1>

      {/* ===== FILTROS ===== */}
      <div className="logs-filtros">
        <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
          <option value="">Todos</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>

        <input
          type="text"
          placeholder="Buscar texto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="text"
          placeholder="Filtrar por tenant (slug)..."
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />

        <button className="delete-btn" onClick={handleDeleteAll}>
          🗑️ Borrar todo
        </button>
      </div>

      {/* ===== TABLA ===== */}
      {loading ? (
        <p>Cargando logs...</p>
      ) : logs.length === 0 ? (
        <p>No hay logs.</p>
      ) : (
        <table className="logs-table">
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
              <tr key={log._id} onClick={() => setSelected(log)}>
                <td className={`nivel nivel-${log.nivel.toLowerCase()}`}>
                  {log.nivel}
                </td>
                <td>{log.accion}</td>
                <td className="mensaje">{log.mensaje}</td>
                <td>{log.tenant || "—"}</td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ===== MODAL DE DETALLES ===== */}
      {selected && (
        <div className="log-modal" onClick={() => setSelected(null)}>
          <div className="log-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Detalle del Log</h2>

            <p><strong>Nivel:</strong> {selected.nivel}</p>
            <p><strong>Acción:</strong> {selected.accion}</p>
            <p><strong>Mensaje:</strong> {selected.mensaje}</p>
            <p><strong>Tenant:</strong> {selected.tenant || "—"}</p>

            <h3>Datos adicionales</h3>
            <pre>{JSON.stringify(selected.datos, null, 2)}</pre>

            <button onClick={() => setSelected(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
