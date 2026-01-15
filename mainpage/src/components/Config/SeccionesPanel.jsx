import { useEffect, useState } from "react";
import api from "../../utils/api";
import ModalConfirmacion from "../Modal/ModalConfirmacion";

/**
 * Panel de gestión de secciones (ALEF)
 * - CRUD completo
 * - Orden editable mediante select (1..N)
 * - Backend es la fuente de verdad del orden
 */
export default function SeccionesPanel({ isPlanEsencial, onAlert }) {
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nuevaSeccion, setNuevaSeccion] = useState({
    nombre: "",
    slug: "",
    destino: "cocina",
  });

  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* =========================
     CARGA INICIAL
  ========================= */
  useEffect(() => {
    cargarSecciones();
  }, []);

  const cargarSecciones = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/secciones");

      // 🔒 Siempre ordenar por seguridad
      const ordenadas = (data || []).sort((a, b) => a.orden - b.orden);
      setSecciones(ordenadas);
    } catch {
      onAlert?.({ tipo: "error", mensaje: "Error cargando secciones." });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CREAR
  ========================= */
  const crearSeccion = async () => {
    if (!nuevaSeccion.nombre.trim()) return;

    try {
      const orden = secciones.length + 1;

      await api.post("/secciones", {
        ...nuevaSeccion,
        orden,
      });

      await cargarSecciones();
      setNuevaSeccion({ nombre: "", slug: "", destino: "cocina" });

      onAlert?.({ tipo: "success", mensaje: "Sección creada." });
    } catch {
      onAlert?.({ tipo: "error", mensaje: "Error al crear sección." });
    }
  };

  /* =========================
     EDITAR (sin tocar orden)
  ========================= */
  const guardarEdicion = async () => {
    try {
      await api.put(`/secciones/${editando._id}`, {
        nombre: editando.nombre,
        slug: editando.slug,
        destino: editando.destino,
      });

      await cargarSecciones();
      setEditando(null);

      onAlert?.({ tipo: "success", mensaje: "Sección actualizada." });
    } catch {
      onAlert?.({ tipo: "error", mensaje: "Error al editar sección." });
    }
  };

  /* =========================
     ELIMINAR + REORDENAR
  ========================= */
  const eliminarSeccion = async (id) => {
    try {
      await api.delete(`/secciones/${id}`);

      // Reordenar las restantes (1..N)
      const restantes = secciones
        .filter((s) => s._id !== id)
        .sort((a, b) => a.orden - b.orden)
        .map((s, index) => ({ ...s, orden: index + 1 }));

      await Promise.all(
        restantes.map((s) =>
          api.put(`/secciones/${s._id}`, { orden: s.orden })
        )
      );

      await cargarSecciones();

      onAlert?.({ tipo: "success", mensaje: "Sección eliminada." });
    } catch {
      onAlert?.({ tipo: "error", mensaje: "Error al eliminar sección." });
    }
  };

  /* =========================
     CAMBIO DE ORDEN (SELECT)
  ========================= */
  const cambiarOrden = async (seccionId, nuevoOrden) => {
    const actual = secciones.find((s) => s._id === seccionId);
    if (!actual || actual.orden === nuevoOrden) return;

    try {
      const reordenadas = secciones.map((s) => {
        if (s._id === seccionId) {
          return { ...s, orden: nuevoOrden };
        }

        // Ajuste de las demás
        if (
          actual.orden < nuevoOrden &&
          s.orden > actual.orden &&
          s.orden <= nuevoOrden
        ) {
          return { ...s, orden: s.orden - 1 };
        }

        if (
          actual.orden > nuevoOrden &&
          s.orden < actual.orden &&
          s.orden >= nuevoOrden
        ) {
          return { ...s, orden: s.orden + 1 };
        }

        return s;
      });

      await Promise.all(
        reordenadas.map((s) =>
          api.put(`/secciones/${s._id}`, { orden: s.orden })
        )
      );

      await cargarSecciones();
    } catch {
      onAlert?.({
        tipo: "error",
        mensaje: "Error al cambiar el orden de las secciones.",
      });
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <section className="config-card card">
      <header className="config-card-header">
        <h2>
          {isPlanEsencial
            ? "📦 Secciones del pedido"
            : "📦 Secciones de la carta"}
        </h2>
        <p className="config-card-subtitle">
          Define el orden en el que aparecen los bloques en el ticket y en cocina.
        </p>
      </header>

      {/* CREAR */}
      <div className="config-field config-field--stacked">
        <label>Nueva sección</label>

        <input
          type="text"
          placeholder="Nombre (Ej: Entrantes)"
          value={nuevaSeccion.nombre}
          onChange={(e) =>
            setNuevaSeccion((p) => ({ ...p, nombre: e.target.value }))
          }
        />

        <input
          type="text"
          placeholder="Slug (entrantes)"
          value={nuevaSeccion.slug}
          onChange={(e) =>
            setNuevaSeccion((p) => ({ ...p, slug: e.target.value }))
          }
        />

        <select
          value={nuevaSeccion.destino}
          onChange={(e) =>
            setNuevaSeccion((p) => ({ ...p, destino: e.target.value }))
          }
        >
          <option value="cocina">Cocina</option>
          <option value="barra">Barra</option>
        </select>

        <button className="btn btn-primario" onClick={crearSeccion}>
          Crear sección
        </button>
      </div>

      {/* LISTADO */}
      <ul className="lista-simple">
        {loading && <li>Cargando secciones...</li>}
        {!loading && secciones.length === 0 && (
          <li>No hay secciones creadas.</li>
        )}

        {secciones.map((s) => (
          <li key={s._id} className="fila-seccion">
            <span>
              {s.nombre} ({s.slug})
            </span>

            <div className="acciones-mini">
              <select
                value={s.orden}
                onChange={(e) =>
                  cambiarOrden(s._id, Number(e.target.value))
                }
              >
                {secciones.map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>

              <button onClick={() => setEditando({ ...s })}>✏️</button>

              <button
                className="delete-btn"
                onClick={() =>
                  setConfirmDelete({ id: s._id, nombre: s.nombre })
                }
              >
                ❌
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* MODAL EDITAR */}
      {editando && (
        <ModalConfirmacion
          titulo="Editar sección"
          onConfirm={guardarEdicion}
          onClose={() => setEditando(null)}
        >
          <div className="modal-form">
            <input
              type="text"
              value={editando.nombre}
              onChange={(e) =>
                setEditando((p) => ({ ...p, nombre: e.target.value }))
              }
            />
            <input
              type="text"
              value={editando.slug}
              onChange={(e) =>
                setEditando((p) => ({ ...p, slug: e.target.value }))
              }
            />
            <select
              value={editando.destino}
              onChange={(e) =>
                setEditando((p) => ({ ...p, destino: e.target.value }))
              }
            >
              <option value="cocina">Cocina</option>
              <option value="barra">Barra</option>
            </select>
          </div>
        </ModalConfirmacion>
      )}

      {/* MODAL ELIMINAR */}
      {confirmDelete && (
        <ModalConfirmacion
          titulo="Eliminar sección"
          mensaje={`¿Eliminar "${confirmDelete.nombre}"?`}
          onConfirm={() => {
            eliminarSeccion(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </section>
  );
}
