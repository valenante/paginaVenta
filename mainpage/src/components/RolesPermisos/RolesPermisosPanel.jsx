import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";
import { useConfig } from "../../context/ConfigContext";
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

  // Acordeón módulos + paginación
  const [openModulos, setOpenModulos] = useState(new Set());
  const MODULOS_PER_PAGE = 6;
  const [moduloPage, setModuloPage] = useState(0);

  // Staff config
  const { config, refreshConfig } = useConfig();
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(true);
  const [comidaPersonalActiva, setComidaPersonalActiva] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    setMostrarEstadisticas(config?.staff?.mostrarEstadisticas !== false);
    setComidaPersonalActiva(config?.staff?.comidaPersonalActiva === true);
  }, [config?.staff?.mostrarEstadisticas, config?.staff?.comidaPersonalActiva]);

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

        const catPayload = catalogoRes?.data || {};
        const resPayload = resumenRes?.data || {};

        const cat = catPayload?.catalogo || [];
        const grp = catPayload?.grupos || {};
        const defs = catPayload?.defaults || {};
        const rolesData = resPayload?.roles || {};

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

    return () => { alive = false; };
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

      const payload = data?.data || data;
      setRoles((prev) => ({
        ...prev,
        [activeRole]: {
          ...prev[activeRole],
          permisos: payload?.permisos || permisos,
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

  // Detectar scope del tenant
  const detectedScope = useMemo(() => {
    const scopes = roleNames.map((r) => roles[r]?.scope).filter(Boolean);
    if (scopes.includes("tpv")) return "tpv";
    return "tpv";
  }, [roleNames, roles]);

  const crearRolHandler = async () => {
    if (!newRole.nombre.trim() || !newRole.descripcion.trim()) {
      showToast("Nombre y descripción son obligatorios", "error");
      return;
    }

    setCreating(true);
    try {
      const { data: raw } = await api.post("/admin/permisos/roles", {
        nombre: newRole.nombre.trim().toLowerCase().replace(/\s+/g, "_"),
        descripcion: newRole.descripcion.trim(),
        scope: detectedScope,
        permisos: [],
      });

      const data = raw?.data || raw;
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

  const toggleMostrarEstadisticas = async () => {
    const nuevoValor = !mostrarEstadisticas;
    setMostrarEstadisticas(nuevoValor);
    setSavingStaff(true);
    try {
      await api.put("/configuracion", { staff: { mostrarEstadisticas: nuevoValor } });
      refreshConfig();
      showToast(
        nuevoValor
          ? "Estadísticas visibles para el staff"
          : "Estadísticas ocultas para el staff",
        "success"
      );
    } catch (err) {
      setMostrarEstadisticas(!nuevoValor);
      showToast(
        err?.response?.data?.message || "Error al guardar configuración",
        "error"
      );
    } finally {
      setSavingStaff(false);
    }
  };

  const toggleComidaPersonal = async () => {
    const nuevoValor = !comidaPersonalActiva;
    setComidaPersonalActiva(nuevoValor);
    setSavingStaff(true);
    try {
      await api.put("/configuracion", { staff: { comidaPersonalActiva: nuevoValor } });
      refreshConfig();
      showToast(
        nuevoValor
          ? "Comida del personal activada"
          : "Comida del personal desactivada",
        "success"
      );
    } catch (err) {
      setComidaPersonalActiva(!nuevoValor);
      showToast(
        err?.response?.data?.message || "Error al guardar configuración",
        "error"
      );
    } finally {
      setSavingStaff(false);
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

  /* ===== LOADING ===== */
  if (loading) {
    return (
      <main className="cfg-page section section--wide">
        <div className="card config-card" style={{ textAlign: "center", padding: "2rem" }}>
          Cargando permisos...
        </div>
      </main>
    );
  }

  /* ===== ERROR ===== */
  if (error) {
    return (
      <main className="cfg-page section section--wide">
        <div className="card config-card" style={{ color: "var(--color-error)" }}>
          {error}
        </div>
      </main>
    );
  }

  const noRoles = roleNames.length === 0;

  return (
    <main className="cfg-page section section--wide">
      {/* ===== HEADER ===== */}
      <header className="cfg-header">
        <div>
          <h1>Roles y permisos</h1>
          <p className="text-suave">
            Selecciona un rol, revisa sus módulos activos y ajusta sus permisos
            con una configuración clara y centralizada.
          </p>
        </div>
      </header>

      {/* ===== KPIs ===== */}
      <div className="cfg-stats" style={{ marginBottom: "var(--space-lg)" }}>
        <article className="cfg-stat">
          <span className="cfg-stat__label">Roles</span>
          <strong>{roleNames.length}</strong>
        </article>
        <article className="cfg-stat">
          <span className="cfg-stat__label">Permisos</span>
          <strong>{totalPermisos}</strong>
        </article>
        <article className="cfg-stat">
          <span className="cfg-stat__label">Módulos</span>
          <strong>{gruposOrdenados.length}</strong>
        </article>
      </div>

      {noRoles && (
        <div className="card config-card">
          <h3>No hay roles disponibles</h3>
          <p className="text-suave">Puedes crear el primer rol para este tenant.</p>
        </div>
      )}

      {/* ===== SELECTOR DE ROL ===== */}
      <section className="card config-card">
        <div className="config-card-header">
          <div>
            <h2>Selecciona el rol a editar</h2>
            <p className="config-card-subtitle">
              Aquí eliges el rol activo. Los roles protegidos pueden revisarse,
              pero no editarse.
            </p>
          </div>
          <button
            className="btn btn-primario"
            onClick={() => setShowCreateForm((v) => !v)}
            type="button"
            style={{ whiteSpace: "nowrap" }}
          >
            {showCreateForm ? "Cancelar" : "+ Crear rol"}
          </button>
        </div>

        {/* Formulario crear rol */}
        {showCreateForm && (
          <div className="rpp-create-form">
            <div className="rpp-create-fields">
              <div className="config-field">
                <label>Identificador</label>
                <input
                  placeholder="ej: encargado"
                  value={newRole.nombre}
                  onChange={(e) => setNewRole((p) => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div className="config-field">
                <label>Descripción</label>
                <input
                  placeholder="ej: Encargado de sala"
                  value={newRole.descripcion}
                  onChange={(e) => setNewRole((p) => ({ ...p, descripcion: e.target.value }))}
                />
              </div>
            </div>
            <button
              className="btn btn-primario"
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

      {/* ===== RESUMEN DEL ROL ACTIVO ===== */}
      {activeRoleData && (
        <section className="card config-card rpp-active-role-card">
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

          <div className="cfg-stats">
            <article className="cfg-stat">
              <span className="cfg-stat__label">Permisos activos</span>
              <strong>{isProtected ? totalPermisos : activeCount}</strong>
            </article>
            <article className="cfg-stat">
              <span className="cfg-stat__label">Módulos activos</span>
              <strong>{isProtected ? gruposOrdenados.length : modulosAccesibles}</strong>
            </article>
            <article className="cfg-stat">
              <span className="cfg-stat__label">Estado</span>
              <strong>{dirty ? "Con cambios" : "Sin cambios"}</strong>
            </article>
          </div>
        </section>
      )}

      {/* ===== TOOLBAR ===== */}
      {!isProtected && activeRole && (
        <div className="rpp-toolbar">
          <div className="rpp-toolbar-left">
            <span className="rpp-counter">
              <strong>{activeCount}</strong> / {totalPermisos} permisos activos
            </span>
            <span className="rpp-counter-sep">·</span>
            <span className="rpp-counter">
              <strong>{modulosAccesibles}</strong> / {gruposOrdenados.length} módulos accesibles
            </span>
          </div>

          <div className="rpp-toolbar-right">
            <button
              className="btn btn-secundario"
              onClick={restaurarDefaults}
              type="button"
            >
              Restaurar defaults
            </button>

            <button
              className="btn btn-primario"
              onClick={guardar}
              disabled={!dirty || saving}
              type="button"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {/* ===== AVISOS ===== */}
      {isProtected && activeRole && (
        <div className="card config-card" style={{ background: "rgba(59,130,246,0.06)", borderColor: "rgba(59,130,246,0.25)" }}>
          El rol <strong>{prettifyRole(activeRole, activeRoleData)}</strong> tiene todos los
          permisos mediante <code style={{ padding: "0.1rem 0.3rem", borderRadius: "6px", background: "rgba(59,130,246,0.1)" }}>*</code> y no puede modificarse desde este panel.
        </div>
      )}

      {!isProtected && activeRole && activeCount === 0 && (
        <div className="card config-card" style={{ background: "var(--color-error-suave)", borderColor: "rgba(239,68,68,0.25)", color: "var(--color-error)" }}>
          Este rol no tiene ningún permiso asignado. Los usuarios con este rol
          no podrán acceder a ninguna funcionalidad.
        </div>
      )}

      {/* ===== OPCIONES DE STAFF ===== */}
      <section className="card config-card">
        <div className="config-card-header">
          <div>
            <h2>Opciones de staff</h2>
            <p className="config-card-subtitle">
              Controla qué información pueden ver los usuarios no administradores
              en su panel de inicio.
            </p>
          </div>
        </div>

        <div className="rpp-permiso-row" style={{ marginBottom: "var(--space-xs)" }}>
          <div className="rpp-permiso-info">
            <span className="rpp-permiso-clave">Mostrar estadísticas personales</span>
            <span className="rpp-permiso-desc">
              Permite que el staff vea su rendimiento (pedidos, importe, productos vendidos)
              en el dashboard de bienvenida.
            </span>
          </div>
          <label className="rpp-toggle">
            <input
              type="checkbox"
              checked={mostrarEstadisticas}
              onChange={toggleMostrarEstadisticas}
              disabled={savingStaff}
            />
            <span className="rpp-toggle-slider" />
          </label>
        </div>

        <div className="rpp-permiso-row">
          <div className="rpp-permiso-info">
            <span className="rpp-permiso-clave">Comida del personal</span>
            <span className="rpp-permiso-desc">
              Permite que los empleados pidan su comida desde el TPV.
              Los productos elegibles se configuran en la sección Cortesias.
            </span>
          </div>
          <label className="rpp-toggle">
            <input
              type="checkbox"
              checked={comidaPersonalActiva}
              onChange={toggleComidaPersonal}
              disabled={savingStaff}
            />
            <span className="rpp-toggle-slider" />
          </label>
        </div>
      </section>

      {/* ===== MÓDULOS (acordeón paginado) ===== */}
      {(() => {
        const totalPages = Math.ceil(gruposOrdenados.length / MODULOS_PER_PAGE);
        const safePage = Math.min(moduloPage, totalPages - 1);
        const start = safePage * MODULOS_PER_PAGE;
        const pageGrupos = gruposOrdenados.slice(start, start + MODULOS_PER_PAGE);

        return (
          <section className="card config-card rpp-accordion">
            <div className="config-card-header">
              <div>
                <h2>Permisos por módulo</h2>
                <p className="config-card-subtitle">
                  Expande cada módulo para ver y editar sus permisos individuales.
                </p>
              </div>
              {totalPages > 1 && (
                <span className="badge badge-aviso">
                  Página {safePage + 1} de {totalPages}
                </span>
              )}
            </div>

            <div className="rpp-accordion-list">
              {pageGrupos.map((grupo) => {
                const permsGrupo = grupos[grupo] || [];
                const activosEnGrupo = permsGrupo.filter((p) => draft.has(p.clave)).length;
                const todosActivos = activosEnGrupo === permsGrupo.length && permsGrupo.length > 0;
                const isOpen = openModulos.has(grupo);

                return (
                  <article className="rpp-accordion-item" key={grupo}>
                    <button
                      type="button"
                      className={`rpp-accordion-trigger ${isOpen ? "open" : ""}`}
                      onClick={() =>
                        setOpenModulos((prev) => {
                          const next = new Set(prev);
                          if (next.has(grupo)) next.delete(grupo);
                          else next.add(grupo);
                          return next;
                        })
                      }
                    >
                      <div className="rpp-accordion-trigger-left">
                        <span className={`rpp-accordion-chevron ${isOpen ? "open" : ""}`}>&#8250;</span>
                        <span className="rpp-accordion-title">{grupo}</span>
                      </div>

                      <div className="rpp-accordion-trigger-right">
                        <span className={`badge ${todosActivos ? "badge-exito" : activosEnGrupo > 0 ? "badge-aviso" : "badge-error"}`}>
                          {activosEnGrupo} / {permsGrupo.length}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="rpp-accordion-body">
                        {!isProtected && (
                          <div className="rpp-accordion-body-toolbar">
                            <button
                              className="rpp-modulo-toggle-all"
                              onClick={() => toggleModulo(grupo)}
                              type="button"
                            >
                              {todosActivos ? "Quitar todo" : "Activar todo"}
                            </button>
                          </div>
                        )}

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
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="rpp-pager">
                <button
                  type="button"
                  className="btn btn-secundario"
                  disabled={safePage === 0}
                  onClick={() => setModuloPage((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </button>

                <div className="rpp-pager-nums">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`rpp-pager-num ${i === safePage ? "active" : ""}`}
                      onClick={() => setModuloPage(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-secundario"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setModuloPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            )}
          </section>
        );
      })()}

      {/* ===== TOAST ===== */}
      {toast && (
        <div className={`rpp-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </main>
  );
}
