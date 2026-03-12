import React, { useEffect, useState, useMemo } from "react";
import "./UsuarioPermisosModal.css";

/**
 * UsuarioPermisosModal — Tri-state per-user permission overrides
 *
 * For each permission:
 *  - "rol"     → inherited from role (default, no override)
 *  - "extra"   → added via permisosExtra (grants permission not in role)
 *  - "revocado" → revoked via permisosRevocados (removes permission from role)
 *
 * Visual states:
 *  - Permission from role, not revoked → checked (tag "Del rol")
 *  - Permission from role, revoked → unchecked (tag "Revocado")
 *  - Permission NOT from role, added as extra → checked (tag "Extra")
 *  - Permission NOT from role, not added → unchecked (no tag)
 */
export default function UsuarioPermisosModal({
  usuario,
  permisosDisponibles = [],
  rolesConfig = {},
  onSave,
  onClose,
}) {
  const [extra, setExtra] = useState([]);
  const [revocados, setRevocados] = useState([]);

  // Permisos base del rol (expandir "*")
  const permisosRolRaw = rolesConfig?.[usuario.role]?.permisos || [];
  const permisosRol = useMemo(() => {
    if (permisosRolRaw.includes("*")) {
      return permisosDisponibles.map((p) => p.clave);
    }
    return permisosRolRaw;
  }, [permisosRolRaw, permisosDisponibles]);

  useEffect(() => {
    setExtra(usuario.permisosExtra || []);
    setRevocados(usuario.permisosRevocados || []);
  }, [usuario]);

  // Agrupar permisos por grupo
  const grupos = useMemo(() => {
    return permisosDisponibles.reduce((acc, p) => {
      if (!acc[p.grupo]) acc[p.grupo] = [];
      acc[p.grupo].push(p);
      return acc;
    }, {});
  }, [permisosDisponibles]);

  // Toggle logic
  const handleToggle = (clave) => {
    const vieneDelRol = permisosRol.includes(clave);

    if (vieneDelRol) {
      // Toggle revocado
      setRevocados((prev) =>
        prev.includes(clave)
          ? prev.filter((x) => x !== clave)
          : [...prev, clave]
      );
      // Limpiar de extra si estaba
      setExtra((prev) => prev.filter((x) => x !== clave));
    } else {
      // Toggle extra
      setExtra((prev) =>
        prev.includes(clave)
          ? prev.filter((x) => x !== clave)
          : [...prev, clave]
      );
      // Limpiar de revocados si estaba
      setRevocados((prev) => prev.filter((x) => x !== clave));
    }
  };

  // Is the permission effectively active?
  const isActive = (clave) => {
    const vieneDelRol = permisosRol.includes(clave);
    const esRevocado = revocados.includes(clave);
    const esExtra = extra.includes(clave);

    if (vieneDelRol) return !esRevocado;
    return esExtra;
  };

  // Count effective permissions
  const effectiveCount = permisosDisponibles.filter((p) => isActive(p.clave)).length;

  // Has changes vs original
  const originalExtra = usuario.permisosExtra || [];
  const originalRevocados = usuario.permisosRevocados || [];
  const hasChanges =
    JSON.stringify([...extra].sort()) !== JSON.stringify([...originalExtra].sort()) ||
    JSON.stringify([...revocados].sort()) !== JSON.stringify([...originalRevocados].sort());

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const r = await onSave(usuario._id, {
      permisosExtra: extra,
      permisosRevocados: revocados,
    });
    setSaving(false);
    if (r?.ok === false) {
      setSaveError(r.error?.message || "Error al guardar permisos");
      return;
    }
    onClose();
  };

  const handleReset = () => {
    setExtra([]);
    setRevocados([]);
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
            <h2 className="permModal-title">Permisos del usuario</h2>
            <p className="permModal-subtitle">
              {usuario.name} ·{" "}
              <span className="permModal-role">{usuario.role}</span>
            </p>
            <p className="permModal-effective">
              {effectiveCount} / {permisosDisponibles.length} permisos efectivos
            </p>
          </div>

          <button className="permModal-close" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* LEGEND */}
        <div className="permModal-legend">
          <span className="tag rol">Del rol</span> Heredado del rol
          <span className="tag extra">Extra</span> Añadido al usuario
          <span className="tag rev">Revocado</span> Quitado al usuario
        </div>

        {/* BODY */}
        <div className="permModal-body">
          {Object.keys(grupos).sort().map((grupo) => (
            <section key={grupo} className="permModal-section">
              <h3 className="permModal-section-title">{grupo}</h3>

              <div className="permModal-permList">
                {grupos[grupo].map((perm) => {
                  const vieneDelRol = permisosRol.includes(perm.clave);
                  const esExtra = extra.includes(perm.clave);
                  const esRev = revocados.includes(perm.clave);
                  const activo = isActive(perm.clave);

                  return (
                    <label key={perm.clave} className="permModal-item">
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={() => handleToggle(perm.clave)}
                      />

                      <div className="permModal-labels">
                        <span className="name">{perm.descripcion}</span>
                        <span className="clave">{perm.clave}</span>

                        {vieneDelRol && !esRev && (
                          <span className="tag rol">Del rol</span>
                        )}
                        {esExtra && <span className="tag extra">Extra</span>}
                        {esRev && <span className="tag rev">Revocado</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* FOOTER */}
        {saveError && (
          <p style={{ color: "#f87171", fontSize: "0.85rem", textAlign: "center", margin: "0.5rem 0 0" }}>
            {saveError}
          </p>
        )}
        <footer className="permModal-footer">
          <button
            className="permModal-btn reset"
            onClick={handleReset}
            type="button"
          >
            Quitar overrides
          </button>
          <button className="permModal-btn cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="permModal-btn save"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? "Guardando..." : "Guardar permisos"}
          </button>
        </footer>
      </div>
    </div>
  );
}
