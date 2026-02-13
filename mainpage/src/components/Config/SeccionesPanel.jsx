import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import "./SeccionesPanel.css";
import "./SeccionesModal.css";

const DESTINOS = [
  { value: "cocina", label: "Cocina" },
  { value: "barra", label: "Barra" },
];

function normalizeErr(err) {
  const data = err?.response?.data || {};
  const code = data?.code || data?.error || "";
  const msg = data?.message || data?.details || data?.error || "";
  return { code: String(code || ""), msg: String(msg || "") };
}

export default function SeccionesPanel({
  isPlanEsencial,
  onAlert,
  disabled = false,
}) {
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nueva, setNueva] = useState({
    nombre: "",
    slug: "",
    destino: "cocina",
    activa: true,
    orden: 0,
  });

  const [editando, setEditando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const puedeGestionar = useMemo(
    () => !disabled && !isPlanEsencial,
    [disabled, isPlanEsencial]
  );

  // ============================
  // Cargar secciones
  // ============================
  const cargar = async () => {
    try {
      setLoading(true);
      // includeInactive=0 por defecto (si tu backend no lo usa, lo ignora)
      const { data } = await api.get("/secciones?includeInactive=0");
      setSecciones(Array.isArray(data) ? data : []);
    } catch {
      onAlert?.({ tipo: "error", mensaje: "Error al cargar secciones." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================
  // Crear
  // ============================
  const crear = async () => {
    const nombre = (nueva.nombre || "").trim();
    if (!nombre) {
      return onAlert?.({ tipo: "error", mensaje: "El nombre es obligatorio." });
    }

    try {
      const payload = {
        nombre,
        slug: (nueva.slug || "").trim(),
        destino: nueva.destino,
        activa: !!nueva.activa,
        orden: Number(nueva.orden) || 0,
      };

      const { data } = await api.post("/secciones", payload);

      setSecciones((prev) =>
        [data, ...prev].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      );

      setNueva({
        nombre: "",
        slug: "",
        destino: "cocina",
        activa: true,
        orden: 0,
      });

      onAlert?.({ tipo: "success", mensaje: "Sección creada correctamente." });
    } catch (err) {
      const e = normalizeErr(err);
      const slugDup =
        e.code === "SLUG_DUPLICADO" ||
        /slug/i.test(e.msg) ||
        /slug/i.test(e.code);

      if (slugDup) {
        return onAlert?.({
          tipo: "error",
          mensaje: "Ese slug ya existe en ese destino.",
        });
      }

      onAlert?.({ tipo: "error", mensaje: "Error al crear sección." });
    }
  };

  // ============================
  // Editar
  // ============================
  const iniciarEdicion = (sec) => {
    setEditando({
      ...sec,
      orden: Number(sec.orden ?? 0),
      activa: sec.activa !== false,
      slug: sec.slug || "",
    });
  };

  const guardarEdicion = async () => {
    if (!editando) return;

    const nombre = (editando.nombre || "").trim();
    if (!nombre) {
      return onAlert?.({ tipo: "error", mensaje: "El nombre es obligatorio." });
    }

    try {
      const payload = {
        nombre,
        slug: (editando.slug || "").trim(),
        destino: editando.destino,
        activa: !!editando.activa,
        orden: Number(editando.orden) || 0,
      };

      const { data } = await api.put(`/secciones/${editando._id}`, payload);

      setSecciones((prev) =>
        prev.map((s) => (s._id === data._id ? data : s))
      );
      setEditando(null);

      onAlert?.({ tipo: "success", mensaje: "Sección actualizada." });
    } catch (err) {
      const e = normalizeErr(err);
      const slugDup =
        e.code === "SLUG_DUPLICADO" ||
        /slug/i.test(e.msg) ||
        /slug/i.test(e.code);

      if (slugDup) {
        return onAlert?.({
          tipo: "error",
          mensaje: "Ese slug ya existe en ese destino.",
        });
      }

      onAlert?.({ tipo: "error", mensaje: "Error al actualizar sección." });
    }
  };

  // ============================
  // Eliminar
  // ============================
  const eliminar = async (id) => {
    try {
      await api.delete(`/secciones/${id}`);
      setSecciones((prev) => prev.filter((s) => s._id !== id));
      onAlert?.({ tipo: "success", mensaje: "Sección eliminada." });
    } catch {
      onAlert?.({ tipo: "error", mensaje: "Error al eliminar sección." });
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <section className="config-card card secciones-panel">
      <header className="config-card-header">
        <h2>🧩 Secciones (cocina / barra)</h2>
        <p className="config-card-subtitle">
          Define secciones para agrupar la producción (fríos, plancha, postres,
          barra, etc.).
        </p>
      </header>

      {isPlanEsencial ? (
        <div className="config-empty">
          <p>Las secciones no están disponibles en el plan esencial.</p>
        </div>
      ) : (
        <>
          {/* NUEVA */}
          <div className="config-field config-field--stacked">
            <label>Nueva sección</label>

            <input
              type="text"
              placeholder="Nombre (Ej: Plancha)"
              value={nueva.nombre}
              disabled={!puedeGestionar}
              onChange={(e) => setNueva((p) => ({ ...p, nombre: e.target.value }))}
            />

            <input
              type="text"
              placeholder="Slug (plancha) — opcional"
              value={nueva.slug}
              disabled={!puedeGestionar}
              onChange={(e) => setNueva((p) => ({ ...p, slug: e.target.value }))}
            />

            <div className="config-grid-2">
              <select
                value={nueva.destino}
                disabled={!puedeGestionar}
                onChange={(e) => setNueva((p) => ({ ...p, destino: e.target.value }))}
              >
                {DESTINOS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                step={1}
                disabled={!puedeGestionar}
                value={nueva.orden}
                onChange={(e) => setNueva((p) => ({ ...p, orden: e.target.value }))}
                placeholder="Orden"
                title="Orden (menor = aparece antes)"
              />
            </div>

            <label className="secciones-check">
              <input
                type="checkbox"
                checked={!!nueva.activa}
                disabled={!puedeGestionar}
                onChange={(e) => setNueva((p) => ({ ...p, activa: e.target.checked }))}
              />
              Activa
            </label>

            <button
              type="button"
              className="btn btn-primario "
              onClick={crear}
              disabled={!puedeGestionar}
            >
              Crear sección
            </button>
          </div>

          {/* LISTA */}
          <div className="config-sep" />

          <div className="config-row">
            <strong>Secciones</strong>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={cargar}
              disabled={disabled}
            >
              Recargar
            </button>
          </div>

          <ul className="secciones-lista">
            {loading && <li className="secciones-item">Cargando secciones…</li>}

            {!loading && secciones.length === 0 && (
              <li className="secciones-item">No hay secciones creadas todavía.</li>
            )}

            {secciones.map((s) => (
              <li key={s._id} className="secciones-item">
                <span className="secciones-item-info">
                  <strong>{s.nombre}</strong>{" "}
                  <span className="text-suave">
                    ({s.slug}) — {s.destino} — orden {s.orden ?? 0}{" "}
                    {s.activa === false ? "⛔ Inactiva" : ""}
                  </span>
                </span>

                <div className="secciones-actions">
                  <button
                    type="button"
                    onClick={() => iniciarEdicion(s)}
                    disabled={!puedeGestionar}
                    title="Editar"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    className="secciones-delete"
                    onClick={() => setAEliminar(s)}
                    disabled={!puedeGestionar}
                    title="Eliminar"
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
        <div className="secciones-modal-overlay" role="dialog" aria-modal="true">
          <div className="secciones-modal">
            <header className="secciones-modal-header">
              <h3>Editar sección</h3>
            </header>

            <div className="secciones-modal-body">
              <input
                type="text"
                value={editando.nombre || ""}
                onChange={(e) =>
                  setEditando((p) => ({ ...p, nombre: e.target.value }))
                }
                placeholder="Nombre"
              />

              <input
                type="text"
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
                  min={0}
                  step={1}
                  value={Number(editando.orden ?? 0)}
                  onChange={(e) =>
                    setEditando((p) => ({ ...p, orden: e.target.value }))
                  }
                  placeholder="Orden"
                />
              </div>

              <label className="secciones-check">
                <input
                  type="checkbox"
                  checked={!!editando.activa}
                  onChange={(e) =>
                    setEditando((p) => ({ ...p, activa: e.target.checked }))
                  }
                />
                Activa
              </label>
            </div>

            <footer className="secciones-modal-footer">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setEditando(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primario "
                onClick={guardarEdicion}
              >
                Guardar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ===== MODAL ELIMINAR ===== */}
      {aEliminar && (
        <div className="secciones-modal-overlay" role="dialog" aria-modal="true">
          <div className="secciones-modal">
            <header className="secciones-modal-header">
              <h3>Eliminar sección</h3>
            </header>

            <div className="secciones-modal-body">
              ¿Seguro que deseas eliminar <strong>{aEliminar.nombre}</strong>?{" "}
              Esta acción no se puede deshacer.
            </div>

            <footer className="secciones-modal-footer">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-peligro"
                onClick={async () => {
                  await eliminar(aEliminar._id);
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
