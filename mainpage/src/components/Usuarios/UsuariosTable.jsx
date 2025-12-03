import React from "react";
import "./UsuariosTable.css";
export default function UsuariosTable({ usuarios, onEditar, onEliminar, onStats }) {
  console.log(usuarios);
  return (
    <section className="usuarios-table-card">
      <div className="usuarios-table-header">
        <h3>Usuarios existentes</h3>
        <span className="usuarios-badge">{usuarios.length}</span>
      </div>

      {/* WRAPPER CON SCROLL */}
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
                      <button className="usuarios-btn usuarios-btn-stats" onClick={() => onStats(u)}>📊</button>
                      <button className="usuarios-btn usuarios-btn-editar" onClick={() => onEditar(u)}>✏️</button>
                      <button className="usuarios-btn usuarios-btn-eliminar" onClick={() => onEliminar(u._id)}>🗑️</button>
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
