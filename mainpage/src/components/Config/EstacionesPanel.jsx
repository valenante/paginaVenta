import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import "./EstacionesPanel.css";
import "./EstacionesModal.css";

const DESTINOS = [
  { value: "cocina", label: "Cocina" },
  { value: "barra", label: "Barra" },
];

function normalizeErr(err) {
  const code = err?.response?.data?.error || err?.response?.data?.code || "";
  const msg = err?.response?.data?.message || "";
  return { code, msg };
}

export default function EstacionesPanel({
  isPlanEsencial,
  onAlert,
  disabled = false,
}) {
  const [estaciones, setEstaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nueva, setNueva] = useState({
    nombre: "",
    slug: "",
    destino: "cocina",
    esCentral: false,
    capacidadMax: 9999,
    orden: 0,
  });

  const [editando, setEditando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const puedeGestionar = useMemo(
    () => !disabled && !isPlanEsencial,
    [disabled, isPlanEsencial]
  );

  // ============================
  // Cargar
  // ============================
  const cargar = async () => {
    try {
      setLoading(true);
      const res = await api.get("/estaciones?includeInactive=0");
      const items = res?.data?.data?.items;
      setEstaciones(Array.isArray(items) ? items : []);
    } catch {
      onAlert?.({ tipo: "error", mensaje: "Error al cargar estaciones." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // ============================
  // Crear
  // ============================
  const crear = async () => {
    if (!nueva.nombre.trim()) {
      return onAlert?.({ tipo: "error", mensaje: "El nombre es obligatorio." });
    }

    try {
      const payload = {
        ...nueva,
        nombre: nueva.nombre.trim(),
        slug: nueva.slug.trim(),
        capacidadMax: Number(nueva.capacidadMax) || 9999,
        orden: Number(nueva.orden) || 0,
      };

      const res = await api.post("/estaciones", payload);
      const created = res?.data?.data?.item;

      if (!created?._id) {
        return onAlert?.({ tipo: "error", mensaje: "La API no devolvió la estación creada." });
      }

      setEstaciones((prev) =>
        [created, ...prev].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      );

      setNueva({
        nombre: "",
        slug: "",
        destino: "cocina",
        esCentral: false,
        capacidadMax: 9999,
        orden: 0,
      });

      onAlert?.({ tipo: "success", mensaje: "Estación creada correctamente." });
    } catch (err) {
      const e = normalizeErr(err);
      onAlert?.({
        tipo: "error",
        mensaje:
          e.code === "SLUG_DUPLICADO"
            ? "Ese slug ya existe en ese destino."
            : "Error al crear estación.",
      });
    }
  };

  // ============================
  // Guardar edición
  // ============================
  const guardarEdicion = async () => {
    if (!editando?.nombre?.trim()) {
      return onAlert?.({ tipo: "error", mensaje: "El nombre es obligatorio." });
    }

    try {
      const payload = {
        ...editando,
        nombre: editando.nombre.trim(),
        slug: editando.slug.trim(),
        capacidadMax: Number(editando.capacidadMax) || 9999,
        orden: Number(editando.orden) || 0,
      };

      const res = await api.put(`/estaciones/${editando._id}`, payload);
      const updated = res?.data?.data?.item;

      if (!updated?._id) {
        return onAlert?.({ tipo: "error", mensaje: "La API no devolvió la estación actualizada." });
      }

      setEstaciones((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      setEditando(null);

      onAlert?.({ tipo: "success", mensaje: "Estación actualizada." });
    } catch (err) {
      const e = normalizeErr(err);
      onAlert?.({
        tipo: "error",
        mensaje:
          e.code === "SLUG_DUPLICADO"
            ? "Ese slug ya existe en ese destino."
            : "Error al actualizar estación.",
      });
    }
  };

  // ============================
  // Eliminar
  // ============================
  const eliminar = async (id) => {
    try {
      await api.delete(`/estaciones/${id}`);
      setEstaciones((prev) => prev.filter((e) => e._id !== id));
      onAlert?.({ tipo: "success", mensaje: "Estación eliminada." });
    } catch {
      onAlert?.({ tipo: "error", mensaje: "Error al eliminar estación." });
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <section className="config-card card">
      <header className="config-card-header">
        <h2>🔥 Estaciones de cocina / barra</h2>
        <p className="config-card-subtitle">
          La estación central puede ver todos los pedidos del sistema y coordinar
          solicitudes entre estaciones. Las estaciones normales solo reciben los
          pedidos asignados a su destino.
        </p>
      </header>

      {isPlanEsencial ? (
        <p className="config-empty">
          Las estaciones no están disponibles en el plan esencial.
        </p>
      ) : (
        <>
          {/* CREAR */}
          <div className="config-field config-field--stacked">
            <label>Nueva estación</label>
            <input
              placeholder="Nombre"
              value={nueva.nombre}
              disabled={!puedeGestionar}
              onChange={(e) =>
                setNueva((p) => ({ ...p, nombre: e.target.value }))
              }
            />
            <input
              placeholder="Slug (opcional)"
              value={nueva.slug}
              disabled={!puedeGestionar}
              onChange={(e) =>
                setNueva((p) => ({ ...p, slug: e.target.value }))
              }
            />

            <div className="config-grid-2">
              <select
                value={nueva.destino}
                disabled={!puedeGestionar}
                onChange={(e) =>
                  setNueva((p) => ({ ...p, destino: e.target.value }))
                }
              >
                {DESTINOS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={nueva.orden}
                onChange={(e) =>
                  setNueva((p) => ({ ...p, orden: e.target.value }))
                }
                placeholder="Orden"
              />
            </div>

            <div className="config-grid-2">
              <input
                type="number"
                value={nueva.capacidadMax}
                onChange={(e) =>
                  setNueva((p) => ({ ...p, capacidadMax: e.target.value }))
                }
                placeholder="Capacidad máxima"
              />

              <label className="check-central">
                <input
                  type="checkbox"
                  checked={nueva.esCentral}
                  onChange={(e) =>
                    setNueva((p) => ({ ...p, esCentral: e.target.checked }))
                  }
                />
                Estación central
              </label>
            </div>
            <button
              className="btn btn-primario "
              onClick={crear}
              disabled={!puedeGestionar}
            >
              Crear estación
            </button>
          </div>

          <div className="config-sep" />

          {/* LISTA */}
          <ul className="lista-simple">
            {loading && <li>Cargando estaciones…</li>}
            {!loading && estaciones.length === 0 && (
              <li>No hay estaciones creadas.</li>
            )}

            {estaciones.map((e) => (
              <li key={e._id}>
                <span>
                  <strong>{e.nombre}</strong>{" "}
                  <span className="text-suave">
                    ({e.slug}) — {e.destino} — cap {e.capacidadMax}{" "}
                    {e.esCentral ? "⭐ Central" : ""}
                  </span>
                </span>

                <div className="acciones-mini">
                  <button
                    onClick={() => setEditando({ ...e })}
                    disabled={!puedeGestionar}
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => setAEliminar(e)}
                    disabled={!puedeGestionar}
                  >
                    ❌
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ===== MODAL EDITAR ===== */}
      {editando && (
        <div className="estaciones-modal-overlay">
          <div className="estaciones-modal">
            <header className="estaciones-modal-header">
              <h3>Editar estación</h3>
            </header>

            <div className="estaciones-modal-body">
              <input
                value={editando.nombre}
                onChange={(e) =>
                  setEditando((p) => ({ ...p, nombre: e.target.value }))
                }
                placeholder="Nombre"
              />

              <input
                value={editando.slug || ""}
                onChange={(e) =>
                  setEditando((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="Slug"
              />

              <div className="config-grid-2">
                <select
                  value={editando.destino}
                  onChange={(e) =>
                    setEditando((p) => ({ ...p, destino: e.target.value }))
                  }
                >
                  {DESTINOS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={editando.orden}
                  onChange={(e) =>
                    setEditando((p) => ({ ...p, orden: e.target.value }))
                  }
                  placeholder="Orden"
                />
              </div>

              <div className="config-grid-2">
                <input
                  type="number"
                  value={editando.capacidadMax}
                  onChange={(e) =>
                    setEditando((p) => ({
                      ...p,
                      capacidadMax: e.target.value,
                    }))
                  }
                  placeholder="Capacidad máxima"
                />

                <label className="check-central">
                  <input
                    type="checkbox"
                    checked={!!editando.esCentral}
                    onChange={(e) =>
                      setEditando((p) => ({
                        ...p,
                        esCentral: e.target.checked,
                      }))
                    }
                  />
                  Estación central
                </label>
                {editando?.esCentral && (
                  <div className="estacion-central-info">
                    ⭐ La estación central puede ver todos los pedidos y coordinar
                    solicitudes entre estaciones.
                  </div>
                )}
              </div>
            </div>

            <footer className="estaciones-modal-footer">
              <button
                className="btn btn-secundario"
                onClick={() => setEditando(null)}
              >
                Cancelar
              </button>
              <button className="btn btn-primario " onClick={guardarEdicion}>
                Guardar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ELIMINAR */}
      {aEliminar && (
        <div className="estaciones-modal-overlay">
          <div className="estaciones-modal">
            <header className="estaciones-modal-header">
              <h3>Eliminar estación</h3>
            </header>
            <div className="estaciones-modal-body">
              ¿Seguro que deseas eliminar <strong>{aEliminar.nombre}</strong>?
            </div>
            <footer className="estaciones-modal-footer">
              <button
                className="btn btn-secundario"
                onClick={() => setAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-peligro"
                onClick={() => {
                  eliminar(aEliminar._id);
                  setAEliminar(null);
                }}
              >
                Eliminar
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
