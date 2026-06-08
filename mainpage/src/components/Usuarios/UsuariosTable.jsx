import { FiEdit2, FiTrash2, FiBarChart2, FiLock } from "react-icons/fi";
import "./UsuariosTable.css";

export default function UsuariosTable({
  usuarios = [],
  onEditar,
  onEliminar,
  onStats,
  onPermisos,
  isPlanEsencial,
  deletingId,
}) {
  const empty = usuarios.length === 0;

  return (
    <section className="usuarios-table-card">
      <div className="usuarios-table-header">
        <h3>Usuarios existentes</h3>
        <span className="usuarios-badge">{usuarios.length}</span>
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="usuarios-table-scroll desktop-only">
        <table className="usuarios-table-main">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estación</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const deleting = deletingId === u._id;

              return (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.estacion || "-"}</td>
                  <td>
                    <div className="usuarios-acciones">
                      {isPlanEsencial ? (
                        <button className="usuarios-btn disabled" disabled><FiLock aria-hidden /></button>
                      ) : (
                        <button className="usuarios-btn" onClick={() => onStats(u)}><FiBarChart2 aria-hidden /></button>
                      )}
                      <button className="usuarios-btn" onClick={() => onEditar(u)}><FiEdit2 aria-hidden /></button>
                      <button className="usuarios-btn" onClick={() => onPermisos(u)}><FiLock aria-hidden /></button>
                      <button
                        className="usuarios-btn danger"
                        onClick={() => onEliminar(u)}
                        disabled={deleting}
                        title={deleting ? "Desactivando..." : "Desactivar usuario"}
                      >
                        {deleting ? "…" : <FiTrash2 aria-hidden />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {empty && (
        <div className="usuarios-empty">
          <h4>No hay usuarios aún</h4>
          <p>Crea el primer usuario para empezar a usar el TPV con tu equipo.</p>
        </div>
      )}

      {/* ===== MOBILE ===== */}
      <div className="usuarios-mobile-list mobile-only">
        {usuarios.map((u) => {
          const deleting = deletingId === u._id;

          return (
            <div key={u._id} className="usuario-card">
              <div className="usuario-main">
                <div className="usuario-info">
                  <strong>{u.name}</strong>
                  <span>{u.email}</span>
                </div>

                <div className="usuario-badges">
                  <span className="badge-role">{u.role}</span>
                  {u.estacion && (
                    <span className="badge-estacion">{u.estacion}</span>
                  )}
                </div>
              </div>

              <div className="usuario-actions">
                {!isPlanEsencial && (
                  <button onClick={() => onStats(u)}><FiBarChart2 aria-hidden /></button>
                )}
                <button onClick={() => onEditar(u)}><FiEdit2 aria-hidden /></button>
                <button onClick={() => onPermisos(u)}><FiLock aria-hidden /></button>
                <button
                  className="usuarios-btn danger"
                  onClick={() => onEliminar(u)}
                  disabled={deleting}
                >
                  {deleting ? "…" : <FiTrash2 aria-hidden />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
