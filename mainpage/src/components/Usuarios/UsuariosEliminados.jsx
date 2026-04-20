// src/components/Usuarios/UsuariosEliminados.jsx
import { useEffect, useState } from "react";
import { FiRefreshCw, FiUserCheck } from "react-icons/fi";
import api from "../../utils/api";

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return "—"; }
}

export default function UsuariosEliminados({ onRestored }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [restoring, setRestoring] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/auth/usuarios/eliminados");
      setUsuarios(Array.isArray(data) ? data : data?.data || []);
    } catch { setUsuarios([]); }
    setLoading(false);
  };

  useEffect(() => { if (open) fetch(); }, [open]);

  const restaurar = async (id, name) => {
    if (!confirm(`¿Restaurar a "${name}"? Volverá a tener acceso al TPV.`)) return;
    setRestoring(id);
    try {
      await api.post(`/auth/usuarios/${id}/restaurar`);
      await fetch();
      if (onRestored) onRestored();
    } catch (e) {
      alert(e?.response?.data?.message || "Error al restaurar");
    }
    setRestoring(null);
  };

  return (
    <div className="usu-eliminados">
      <button className="usu-eliminados__toggle" onClick={() => setOpen(v => !v)} type="button">
        {open ? "▾" : "▸"} Usuarios eliminados {!open && usuarios.length > 0 ? `(${usuarios.length})` : ""}
      </button>

      {open && (
        <div className="usu-eliminados__body">
          {loading ? (
            <p className="usu-eliminados__empty">Cargando...</p>
          ) : usuarios.length === 0 ? (
            <p className="usu-eliminados__empty">No hay usuarios eliminados</p>
          ) : (
            <table className="usu-eliminados__table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Eliminado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{fmt(u.deletedAt)}</td>
                    <td>
                      <button
                        className="usu-eliminados__restore-btn"
                        onClick={() => restaurar(u._id, u.name)}
                        disabled={restoring === u._id}
                        title="Restaurar usuario"
                      >
                        <FiUserCheck /> {restoring === u._id ? "..." : "Restaurar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
