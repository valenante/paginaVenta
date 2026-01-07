import React, { useEffect, useState } from "react";
import "./UsuarioPermisosModal.css";

export default function UsuarioPermisosModalShop({
  usuario,
  permisosDisponibles,
  rolesConfig,
  onSave,
  onClose,
}) {
  const [extra, setExtra] = useState([]);
  const [revocados, setRevocados] = useState([]);

  const permisosRol = rolesConfig?.[usuario.role]?.permisos || [];

  useEffect(() => {
    setExtra(usuario.permisosExtra || []);
    setRevocados(usuario.permisosRevocados || []);
  }, [usuario]);

  /* =====================
     Agrupar permisos
  ===================== */
  const grupos = permisosDisponibles.reduce((acc, p) => {
    if (!acc[p.grupo]) acc[p.grupo] = [];
    acc[p.grupo].push(p);
    return acc;
  }, {});

  const toggleExtra = (clave) =>
    setExtra((prev) =>
      prev.includes(clave)
        ? prev.filter((x) => x !== clave)
        : [...prev, clave]
    );

  const toggleRevocado = (clave) =>
    setRevocados((prev) =>
      prev.includes(clave)
        ? prev.filter((x) => x !== clave)
        : [...prev, clave]
    );

  const handleSave = () => {
    onSave(usuario._id, {
      permisosExtra: extra,
      permisosRevocados: revocados,
    });
    onClose();
  };

  return (
    <div
      className="permModal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="permModal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="permModal-header">
          <div>
            <h2 className="permModal-title">
              Permisos del empleado
            </h2>
            <p className="permModal-subtitle">
              {usuario.name} ·{" "}
              <span className="permModal-role">
                {usuario.role}
              </span>
            </p>
          </div>

          <button className="permModal-close" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* BODY */}
        <div className="permModal-body">
          {/* Rol base */}
          <section className="permModal-section">
            <h3 className="permModal-section-title">
              Rol asignado
            </h3>
            <div className="permModal-roleBox">
              {usuario.role}
            </div>
            <p className="permModal-help">
              Este es el rol base del empleado.  
              Los permisos pueden ampliarse o limitarse manualmente.
            </p>
          </section>

          {/* Grupos de permisos */}
          {Object.keys(grupos).map((grupo) => (
            <section key={grupo} className="permModal-section">
              <h3 className="permModal-section-title">
                {grupo}
              </h3>

              <div className="permModal-permList">
                {grupos[grupo].map((perm) => {
                  const vieneDelRol = permisosRol.includes(perm.clave);
                  const esExtra = extra.includes(perm.clave);
                  const esRev = revocados.includes(perm.clave);

                  return (
                    <label key={perm.clave} className="permModal-item">
                      <input
                        type="checkbox"
                        checked={vieneDelRol ? esRev : esExtra}
                        onChange={() =>
                          vieneDelRol
                            ? toggleRevocado(perm.clave)
                            : toggleExtra(perm.clave)
                        }
                      />

                      <div className="permModal-labels">
                        <span className="name">
                          {perm.descripcion}
                        </span>

                        {vieneDelRol && (
                          <span className="tag rol">
                            Incluido en el rol
                          </span>
                        )}
                        {esExtra && (
                          <span className="tag extra">
                            Permiso adicional
                          </span>
                        )}
                        {esRev && (
                          <span className="tag rev">
                            Permiso desactivado
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="permModal-footer">
          <button
            className="permModal-btn cancel"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="permModal-btn save"
            onClick={handleSave}
          >
            Guardar permisos
          </button>
        </footer>
      </div>
    </div>
  );
}
