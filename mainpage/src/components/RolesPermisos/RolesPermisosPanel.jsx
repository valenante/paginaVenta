import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";
import "./RolesPermisosPanel.css";

const PROTECTED_ROLES = ["admin_restaurante", "admin_shop"];

const prettifyRole = (roleName, roleData) => {
  if (roleData?.descripcion) return roleData.descripcion;

  return String(roleName || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function RolesPermisosPanel() {
  const [catalogo, setCatalogo] = useState([]);
  const [grupos, setGrupos] = useState({});
  const [defaults, setDefaults] = useState({});
  const [roles, setRoles] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeRole, setActiveRole] = useState(null);
  const [draft, setDraft] = useState(new Set());
  const [dirty, setDirty] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Crear rol
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState({ nombre: "", descripcion: "" });
  const [creating, setCreating] = useState(false);

  // Eliminar rol
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [catalogoRes, resumenRes] = await Promise.all([
          api.get("/admin/permisos/catalogo"),
          api.get("/admin/permisos"),
        ]);

        if (!alive) return;

        const cat = catalogoRes?.data?.catalogo || [];
        const grp = catalogoRes?.data?.grupos || {};
        const defs = catalogoRes?.data?.defaults || {};
        const rolesData = resumenRes?.data?.roles || {};

        setCatalogo(cat);
        setGrupos(grp);
        setDefaults(defs);
        setRoles(rolesData);

        const roleNames = Object.keys(rolesData);
        const firstEditable = roleNames.find((r) => !PROTECTED_ROLES.includes(r));
        const first = firstEditable || roleNames[0] || null;

        setActiveRole(first);

        if (first && rolesData[first]) {
          const perms = rolesData[first]?.permisos || [];
          const normalized = perms.includes("*")
            ? cat.map((p) => p.clave)
            : perms.filter((p) => p !== "*");
          setDraft(new Set(normalized));
        }
      } catch (err) {
        if (!alive) return;
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Error al cargar permisos"
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const roleNames = useMemo(() => Object.keys(roles), [roles]);

  const editableRoles = useMemo(
    () => roleNames.filter((r) => !PROTECTED_ROLES.includes(r)),
    [roleNames]
  );

  const protectedRoles = useMemo(
    () => roleNames.filter((r) => PROTECTED_ROLES.includes(r)),
    [roleNames]
  );

  const activeRoleData = activeRole ? roles[activeRole] || null : null;
  const isProtected = PROTECTED_ROLES.includes(activeRole);

  const totalPermisos = catalogo.length;

  const gruposOrdenados = useMemo(() => Object.keys(grupos).sort(), [grupos]);

  const activeCount = draft.size;

  const modulosAccesibles = useMemo(() => {
    return gruposOrdenados.filter((grupo) => {
      const permsGrupo = grupos[grupo] || [];
      return permsGrupo.some((p) => draft.has(p.clave));
    }).length;
  }, [draft, grupos, gruposOrdenados]);

  const activeRoleCount = useMemo(() => {
    if (!activeRoleData) return 0;
    const perms = activeRoleData?.permisos || [];
    return perms.includes("*") ? totalPermisos : perms.length;
  }, [activeRoleData, totalPermisos]);

  const selectRole = (roleName) => {
    if (!roles[roleName]) return;

    const perms = roles[roleName]?.permisos || [];
    const normalized = perms.includes("*")
      ? catalogo.map((p) => p.clave)
      : perms.filter((p) => p !== "*");

    setActiveRole(roleName);
    setDraft(new Set(normalized));
    setDirty(false);
  };

  const togglePermiso = (clave) => {
    if (isProtected) return;

    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) next.delete(clave);
      else next.add(clave);
      return next;
    });

    setDirty(true);
  };

  const toggleModulo = (grupo) => {
    if (isProtected) return;

    const permsGrupo = grupos[grupo] || [];
    const claves = permsGrupo.map((p) => p.clave);

    setDraft((prev) => {
      const next = new Set(prev);
      const allActive = claves.every((c) => next.has(c));

      if (allActive) claves.forEach((c) => next.delete(c));
      else claves.forEach((c) => next.add(c));

      return next;
    });

    setDirty(true);
  };

  const restaurarDefaults = () => {
    if (isProtected || !activeRole) return;

    const defaultPerms = defaults[activeRole];
    if (!defaultPerms) {
      showToast("No hay defaults definidos para este rol", "error");
      return;
    }

    setDraft(new Set(defaultPerms.filter((p) => p !== "*")));
    setDirty(true);
    showToast("Defaults restaurados. Pulsa Guardar para aplicar.", "success");
  };

  const guardar = async () => {
    if (isProtected || !activeRole || !dirty) return;

    setSaving(true);
    try {
      const permisos = Array.from(draft);

      const { data } = await api.put(`/admin/permisos/roles/${activeRole}`, {
        permisos,
      });

      setRoles((prev) => ({
        ...prev,
        [activeRole]: {
          ...prev[activeRole],
          permisos: data?.permisos || permisos,
        },
      }));

      setDirty(false);
      showToast("Permisos guardados correctamente", "success");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Error al guardar los permisos",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // Detectar scope del tenant (basado en roles existentes)
  const detectedScope = useMemo(() => {
    const scopes = roleNames.map((r) => roles[r]?.scope).filter(Boolean);
    if (scopes.includes("shop")) return "shop";
    return "tpv";
  }, [roleNames, roles]);

  const crearRolHandler = async () => {
    if (!newRole.nombre.trim() || !newRole.descripcion.trim()) {
      showToast("Nombre y descripción son obligatorios", "error");
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post("/admin/permisos/roles", {
        nombre: newRole.nombre.trim().toLowerCase().replace(/\s+/g, "_"),
        descripcion: newRole.descripcion.trim(),
        scope: detectedScope,
        permisos: [],
      });

      const roleName = data.role;
      setRoles((prev) => ({
        ...prev,
        [roleName]: {
          permisos: data.permisos || [],
          descripcion: data.descripcion,
          scope: data.scope,
        },
      }));

      setNewRole({ nombre: "", descripcion: "" });
      setShowCreateForm(false);
      selectRole(roleName);
      showToast(`Rol "${data.descripcion}" creado`, "success");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Error al crear el rol",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const eliminarRolHandler = async (roleName) => {
    if (PROTECTED_ROLES.includes(roleName)) return;

    setDeleting(roleName);
    try {
      await api.delete(`/admin/permisos/roles/${roleName}`);

      setRoles((prev) => {
        const next = { ...prev };
        delete next[roleName];
        return next;
      });

      if (activeRole === roleName) {
        const remaining = Object.keys(roles).filter((r) => r !== roleName);
        const nextRole = remaining.find((r) => !PROTECTED_ROLES.includes(r)) || remaining[0] || null;
        if (nextRole) selectRole(nextRole);
        else {
          setActiveRole(null);
          setDraft(new Set());
        }
      }

      showToast(`Rol "${roleName}" eliminado`, "success");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Error al eliminar el rol",
        "error"
      );
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="rpp-root">
        <div className="rpp-loading-card">
          <div className="rpp-spinner" />
          <span>Cargando permisos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rpp-root">
        <div className="rpp-error-card">{error}</div>
      </div>
    );
  }

  const noRoles = roleNames.length === 0;

  return (
    <div className="rpp-root">
      {/* Header */}
      <section className="rpp-header">
        {noRoles && (
          <div className="rpp-empty-card">
            <h3>No hay roles disponibles</h3>
            <p>Puedes crear el primer rol para este tenant.</p>
          </div>
        )}
        <div>
          <h2>Roles y permisos</h2>
          <p>
            Selecciona un rol, revisa sus módulos activos y ajusta sus permisos
            con una configuración clara y centralizada.
          </p>
        </div>

        <div className="rpp-header-kpis">
          <div className="rpp-kpi">
            <span>Roles</span>
            <strong>{roleNames.length}</strong>
          </div>
          <div className="rpp-kpi">
            <span>Permisos</span>
            <strong>{totalPermisos}</strong>
          </div>
          <div className="rpp-kpi">
            <span>Módulos</span>
            <strong>{gruposOrdenados.length}</strong>
          </div>
        </div>
      </section>

      {/* Selector de rol */}
      <section className="rpp-role-selector-card">
        <div className="rpp-section-head">
          <div>
            <h3>Selecciona el rol a editar</h3>
            <p>
              Aquí eliges el rol activo. Los roles protegidos pueden revisarse,
              pero no editarse.
            </p>
          </div>
          <button
            className="rpp-btn rpp-btn--primary rpp-btn--sm"
            onClick={() => setShowCreateForm((v) => !v)}
            type="button"
          >
            {showCreateForm ? "Cancelar" : "+ Crear rol"}
          </button>
        </div>

        {/* Formulario crear rol */}
        {showCreateForm && (
          <div className="rpp-create-form">
            <div className="rpp-create-fields">
              <input
                className="rpp-create-input"
                placeholder="Identificador (ej: encargado)"
                value={newRole.nombre}
                onChange={(e) => setNewRole((p) => ({ ...p, nombre: e.target.value }))}
              />
              <input
                className="rpp-create-input"
                placeholder="Descripción (ej: Encargado de sala)"
                value={newRole.descripcion}
                onChange={(e) => setNewRole((p) => ({ ...p, descripcion: e.target.value }))}
              />
            </div>
            <button
              className="rpp-btn rpp-btn--primary rpp-btn--sm"
              onClick={crearRolHandler}
              disabled={creating}
              type="button"
            >
              {creating ? "Creando..." : "Crear"}
            </button>
          </div>
        )}

        {editableRoles.length > 0 && (
          <div className="rpp-role-group">
            <span className="rpp-role-group-label">Roles editables</span>
            <div className="rpp-roles">
              {editableRoles.map((roleName) => {
                const isActive = activeRole === roleName;
                const roleData = roles[roleName];
                const rolePerms = roleData?.permisos || [];
                const count = rolePerms.includes("*")
                  ? totalPermisos
                  : rolePerms.length;

                return (
                  <div key={roleName} className="rpp-role-pill-wrapper">
                    <button
                      type="button"
                      className={`rpp-role-pill ${isActive ? "active" : ""}`}
                      onClick={() => selectRole(roleName)}
                    >
                      <span className="rpp-role-pill-name">
                        {prettifyRole(roleName, roleData)}
                      </span>
                      <span className="rpp-role-count">{count}</span>
                    </button>
                    <button
                      type="button"
                      className="rpp-role-delete"
                      title={`Eliminar rol ${roleName}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarRolHandler(roleName);
                      }}
                      disabled={deleting === roleName}
                    >
                      {deleting === roleName ? "..." : "×"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {protectedRoles.length > 0 && (
          <div className="rpp-role-group">
            <span className="rpp-role-group-label">Roles protegidos</span>
            <div className="rpp-roles">
              {protectedRoles.map((roleName) => {
                const isActive = activeRole === roleName;
                const roleData = roles[roleName];
                const rolePerms = roleData?.permisos || [];
                const count = rolePerms.includes("*")
                  ? totalPermisos
                  : rolePerms.length;

                return (
                  <button
                    key={roleName}
                    type="button"
                    className={`rpp-role-pill protected ${isActive ? "active" : ""}`}
                    onClick={() => selectRole(roleName)}
                  >
                    <span className="rpp-role-pill-name">
                      {prettifyRole(roleName, roleData)}
                    </span>
                    <span className="rpp-role-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Resumen del rol activo */}
      {activeRoleData && (
        <section className="rpp-active-role-card">
          <div className="rpp-active-role-left">
            <span className={`rpp-role-badge ${isProtected ? "protected" : "editable"}`}>
              {isProtected ? "Rol protegido" : "Rol editable"}
            </span>

            <h3>
              Editando: {prettifyRole(activeRole, activeRoleData)}
            </h3>

            <p>
              {isProtected
                ? "Este rol tiene acceso total mediante '*' y se muestra solo para revisión."
                : "Activa o desactiva permisos por módulo. Los cambios afectarán a todos los usuarios con este rol."}
            </p>
          </div>

          <div className="rpp-active-role-stats">
            <div className="rpp-mini-stat">
              <span>Permisos activos</span>
              <strong>{isProtected ? totalPermisos : activeCount}</strong>
            </div>
            <div className="rpp-mini-stat">
              <span>Módulos activos</span>
              <strong>{isProtected ? gruposOrdenados.length : modulosAccesibles}</strong>
            </div>
            <div className="rpp-mini-stat">
              <span>Estado</span>
              <strong>{dirty ? "Con cambios" : "Sin cambios"}</strong>
            </div>
          </div>
        </section>
      )}

      {/* Toolbar */}
      {!isProtected && activeRole && (
        <section className="rpp-toolbar">
          <div className="rpp-toolbar-left">
            <span className="rpp-counter">
              <strong>{activeCount}</strong> / {totalPermisos} permisos activos
            </span>
            <span className="rpp-counter-sep">•</span>
            <span className="rpp-counter">
              <strong>{modulosAccesibles}</strong> / {gruposOrdenados.length} módulos accesibles
            </span>
          </div>

          <div className="rpp-toolbar-right">
            <button
              className="rpp-btn rpp-btn--ghost"
              onClick={restaurarDefaults}
              type="button"
            >
              Restaurar defaults
            </button>

            <button
              className="rpp-btn rpp-btn--primary"
              onClick={guardar}
              disabled={!dirty || saving}
              type="button"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </section>
      )}

      {/* Avisos */}
      {isProtected && activeRole && (
        <div className="rpp-info-card">
          El rol <strong>{prettifyRole(activeRole, activeRoleData)}</strong> tiene todos los
          permisos mediante <code>*</code> y no puede modificarse desde este panel.
        </div>
      )}

      {!isProtected && activeRole && activeCount === 0 && (
        <div className="rpp-warning-card">
          Este rol no tiene ningún permiso asignado. Los usuarios con este rol
          no podrán acceder a ninguna funcionalidad.
        </div>
      )}

      {/* Módulos */}
      <section className="rpp-modulos-grid">
        {gruposOrdenados.map((grupo) => {
          const permsGrupo = grupos[grupo] || [];
          const activosEnGrupo = permsGrupo.filter((p) => draft.has(p.clave)).length;
          const todosActivos = activosEnGrupo === permsGrupo.length && permsGrupo.length > 0;

          return (
            <article className="rpp-modulo-card" key={grupo}>
              <div className="rpp-modulo-header">
                <div>
                  <h4>{grupo}</h4>
                  <p>
                    {activosEnGrupo} de {permsGrupo.length} permisos activos
                  </p>
                </div>

                {!isProtected && (
                  <button
                    className="rpp-modulo-toggle-all"
                    onClick={() => toggleModulo(grupo)}
                    type="button"
                  >
                    {todosActivos ? "Quitar todo" : "Activar todo"}
                  </button>
                )}
              </div>

              <div className="rpp-modulo-permisos">
                {permsGrupo.map((perm) => (
                  <div className="rpp-permiso-row" key={perm.clave}>
                    <div className="rpp-permiso-info">
                      <span className="rpp-permiso-clave">{perm.clave}</span>
                      <span className="rpp-permiso-desc">{perm.descripcion}</span>
                    </div>

                    <label className="rpp-toggle">
                      <input
                        type="checkbox"
                        checked={draft.has(perm.clave)}
                        onChange={() => togglePermiso(perm.clave)}
                        disabled={isProtected}
                      />
                      <span className="rpp-toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      {/* Toast */}
      {toast && (
        <div className={`rpp-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}