import React from "react";
import "./UsuariosTable.css";

export default function UsuariosTable({
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
        <h3>Usuarios existentes</h3>
        <span className="usuarios-badge">{usuarios.length}</span>
      </div>

      <div className="usuarios-table-scroll">
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
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="5" className="usuarios-empty-cell">
                  Sin usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.estacion || "-"}</td>
                  <td>
                    <div className="usuarios-acciones">

                      {/* Stats */}
                      {isPlanEsencial ? (
                        <button
                          className="usuarios-btn usuarios-btn-stats disabled"
                          title="Estadísticas disponibles solo en el plan Pro"
                          style={{ opacity: 0.4, cursor: "not-allowed" }}
                          disabled
                        >
                          🔒
                        </button>
                      ) : (
                        <button
                          className="usuarios-btn usuarios-btn-stats"
                          onClick={() => onStats(u)}
                        >
                          📊
                        </button>
                      )}

                      {/* Editar */}
                      <button
                        className="usuarios-btn usuarios-btn-editar"
                        onClick={() => onEditar(u)}
                      >
                        ✏️
                      </button>

                      {/* Permisos - NUEVO */}
                      <button
                        className="usuarios-btn usuarios-btn-permisos"
                        onClick={() => onPermisos(u)}
                        title="Editar permisos"
                      >
                        🔐
                      </button>

                      {/* Eliminar */}
                      <button
                        className="usuarios-btn usuarios-btn-eliminar"
                        onClick={() => onEliminar(u._id)}
                      >
                        🗑️
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
