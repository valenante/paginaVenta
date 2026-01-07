import React from "react";
import "./UsuariosTable.css";

export default function UsuariosTableShop({
  usuarios,
  onEditar,
  onEliminar,
  onStats,
  onPermisos,
  isPlanEsencial,
}) {
  return (
    <section className="usuarios-table-card">
      <div className="usuarios-table-header">
        <h3>Empleados</h3>
        <span className="usuarios-badge">{usuarios.length}</span>
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="usuarios-table-scroll desktop-only">
        <table className="usuarios-table-main">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge-role">
                    {u.role}
                  </span>
                </td>

                <td>
                  <div className="usuarios-acciones">
                    {isPlanEsencial ? (
                      <button
                        className="usuarios-btn disabled"
                        disabled
                        title="Disponible en plan superior"
                      >
                        🔒
                      </button>
                    ) : (
                      <button
                        className="usuarios-btn"
                        onClick={() => onStats(u)}
                        title="Ver estadísticas"
                      >
                        📊
                      </button>
                    )}

                    <button
                      className="usuarios-btn"
                      onClick={() => onEditar(u)}
                      title="Editar empleado"
                    >
                      ✏️
                    </button>

                    <button
                      className="usuarios-btn"
                      onClick={() => onPermisos(u)}
                      title="Permisos"
                    >
                      🔐
                    </button>

                    <button
                      className="usuarios-btn danger"
                      onClick={() => onEliminar(u._id)}
                      title="Eliminar empleado"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="usuarios-mobile-list mobile-only">
        {usuarios.map((u) => (
          <div key={u._id} className="usuario-card">
            <div className="usuario-main">
              <div className="usuario-info">
                <strong>{u.name}</strong>
                <span>{u.email}</span>
              </div>

              <div className="usuario-badges">
                <span className="badge-role">
                  {u.role}
                </span>
              </div>
            </div>

            <div className="usuario-actions">
              {!isPlanEsencial && (
                <button
                  onClick={() => onStats(u)}
                  title="Estadísticas"
                >
                  📊
                </button>
              )}

              <button
                onClick={() => onEditar(u)}
                title="Editar"
              >
                ✏️
              </button>

              <button
                onClick={() => onPermisos(u)}
                title="Permisos"
              >
                🔐
              </button>

              <button
                className="danger"
                onClick={() => onEliminar(u._id)}
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
