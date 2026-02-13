// src/components/Extras/ExtrasPanel.jsx  ✅ PRODUCCIÓN
// - Refresco instantáneo (optimistic UI) en crear/editar/eliminar
// - Previene dobles clicks (loading states)
// - Manejo de errores con alerta (sin console spam)
// - Soporta soft delete (activo=false) y oculta desactivados por defecto
// - Orden consistente (más recientes arriba)
// - Validación mínima en UI (nombre / precio)
// - Evita race conditions en fetch (AbortController)
// - Sin “parpadeos”: actualiza estado local y revalida en background

import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";
import "./ExtrasPanel.css";
import ModalConfirmacion from "../Modal/ModalConfirmacion";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje"; // ajusta si tu ruta difiere

const to2 = (n) => Number(Math.round(Number(n) * 100) / 100);

const sanitizeNombre = (s) =>
  String(s ?? "").trim().replace(/\s+/g, " ").slice(0, 60);

const parsePrecio = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const p = to2(n);
  if (p <= 0) return null;
  if (p > 999999) return null;
  return p;
};

const byCreatedDesc = (a, b) => {
  const da = new Date(a?.createdAt || 0).getTime();
  const db = new Date(b?.createdAt || 0).getTime();
  return db - da;
};

export default function ExtrasPanel({ onBack }) {
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);

  const [alerta, setAlerta] = useState(null);

  const [nuevoExtra, setNuevoExtra] = useState({ nombre: "", precio: "" });

  const [editandoId, setEditandoId] = useState(null);
  const [editValues, setEditValues] = useState({ nombre: "", precio: "" });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [extraAEliminar, setExtraAEliminar] = useState(null);

  const abortRef = useRef(null);

  // ========= Lista visible: ocultar inactivos por defecto =========
  const extrasVisibles = useMemo(() => {
    const arr = Array.isArray(extras) ? extras : [];
    return arr
      .filter((e) => e?.activo !== false) // si soft-delete, lo ocultamos
      .slice()
      .sort(byCreatedDesc);
  }, [extras]);

  // ========= Fetch extras (seguro + sin races) =========
  const fetchExtras = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const res = await api.get("/extras", { signal: ac.signal });
      const data = Array.isArray(res.data) ? res.data : [];
      setExtras(data);
    } catch (err) {
      // Abort => no mostrar error
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;

      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.mensaje ||
          err?.response?.data?.error ||
          "No se pudieron cargar los extras.",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtras();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ========= Helpers UI =========
  const resetCreate = () => setNuevoExtra({ nombre: "", precio: "" });

  const iniciarEdicion = (extra) => {
    setEditandoId(extra._id);
    setEditValues({
      nombre: extra.nombre ?? "",
      precio: String(extra.precio ?? ""),
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditValues({ nombre: "", precio: "" });
  };

  // ========= CREATE (optimistic) =========
  const handleCrearExtra = async () => {
    if (savingCreate || savingEdit || savingDelete) return;

    const nombre = sanitizeNombre(nuevoExtra.nombre);
    const precio = parsePrecio(nuevoExtra.precio);

    if (!nombre) {
      setAlerta({ tipo: "warn", mensaje: "Escribe un nombre válido." });
      return;
    }
    if (precio == null) {
      setAlerta({ tipo: "warn", mensaje: "Escribe un precio válido (> 0)." });
      return;
    }

    setSavingCreate(true);

    // optimistic item (temporal)
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      _id: tempId,
      nombre,
      precio,
      activo: true,
      createdAt: new Date().toISOString(),
      __optimistic: true,
    };

    setExtras((prev) => [optimistic, ...(Array.isArray(prev) ? prev : [])]);
    resetCreate();

    try {
      const { data } = await api.post("/extras", { nombre, precio });

      // reemplazar el temp por el real
      setExtras((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map((x) => (x._id === tempId ? data : x));
      });

      setAlerta({ tipo: "exito", mensaje: "Extra creado." });

      // revalidación silenciosa (por si el back aplica normalizaciones)
      fetchExtras({ silent: true });
    } catch (err) {
      // rollback: quitar el temp
      setExtras((prev) => (Array.isArray(prev) ? prev.filter((x) => x._id !== tempId) : []));

      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.mensaje ||
          err?.response?.data?.error ||
          "No se pudo crear el extra.",
      });
    } finally {
      setSavingCreate(false);
    }
  };

  // ========= UPDATE (optimistic) =========
  const guardarEdicion = async () => {
    if (!editandoId) return;
    if (savingCreate || savingEdit || savingDelete) return;

    const nombre = sanitizeNombre(editValues.nombre);
    const precio = parsePrecio(editValues.precio);

    if (!nombre) {
      setAlerta({ tipo: "warn", mensaje: "Nombre inválido." });
      return;
    }
    if (precio == null) {
      setAlerta({ tipo: "warn", mensaje: "Precio inválido (> 0)." });
      return;
    }

    setSavingEdit(true);

    // snapshot para rollback
    const prevSnapshot = extras;

    // optimistic
    setExtras((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.map((x) =>
        x._id === editandoId ? { ...x, nombre, precio } : x
      );
    });

    try {
      const { data } = await api.put(`/extras/${editandoId}`, {
        nombre,
        precio,
      });

      // asegurar estado final con respuesta backend
      setExtras((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map((x) => (x._id === editandoId ? data : x));
      });

      cancelarEdicion();
      setAlerta({ tipo: "exito", mensaje: "Extra actualizado." });
      fetchExtras({ silent: true });
    } catch (err) {
      // rollback
      setExtras(prevSnapshot);

      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.mensaje ||
          err?.response?.data?.error ||
          "No se pudo guardar la edición.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // ========= DELETE (optimistic / compatible con soft delete) =========
  const confirmarEliminar = (extra) => {
    setExtraAEliminar(extra);
    setMostrarModal(true);
  };

  const ejecutarEliminacion = async () => {
    if (!extraAEliminar?._id) return;
    if (savingCreate || savingEdit || savingDelete) return;

    setSavingDelete(true);
    const id = extraAEliminar._id;

    // snapshot para rollback
    const prevSnapshot = extras;

    // optimistic: ocultar inmediatamente
    setExtras((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.map((x) => (x._id === id ? { ...x, activo: false } : x));
    });

    try {
      await api.delete(`/extras/${id}`); // por defecto en back: soft delete (activo=false)
      setAlerta({ tipo: "exito", mensaje: "Extra eliminado." });

      setMostrarModal(false);
      setExtraAEliminar(null);

      // revalidación silenciosa
      fetchExtras({ silent: true });
    } catch (err) {
      // rollback
      setExtras(prevSnapshot);

      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.mensaje ||
          err?.response?.data?.error ||
          "No se pudo eliminar el extra.",
      });
    } finally {
      setSavingDelete(false);
    }
  };

  const disabledGlobal = savingCreate || savingEdit || savingDelete;

  return (
    <div className="extras-panel">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3200}
        />
      )}

      <div className="extras-panel-header">
        <div>
          <h2>Extras disponibles</h2>
          <p className="extras-hint">
            Crea, edita o elimina extras. Los cambios se reflejan al instante.
          </p>
        </div>

        <div className="extras-header-actions">
          <button onClick={onBack} className="btn-gris btn-volver-extras" disabled={disabledGlobal}>
            Volver
          </button>

          <button
            type="button"
            className="btn-gris"
            onClick={() => fetchExtras()}
            disabled={loading || disabledGlobal}
            title="Refrescar"
          >
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {/* LISTA */}
      <ul className="extras-list">
        {loading && extrasVisibles.length === 0 && (
          <li className="extras-empty">Cargando extras…</li>
        )}

        {!loading && extrasVisibles.length === 0 && (
          <li className="extras-empty">No hay extras creados todavía.</li>
        )}

        {extrasVisibles.map((extra) => (
          <li key={extra._id} className="extras-item">
            {editandoId === extra._id ? (
              <>
                <input
                  type="text"
                  value={editValues.nombre}
                  onChange={(e) =>
                    setEditValues((p) => ({ ...p, nombre: e.target.value }))
                  }
                  disabled={savingEdit}
                />
                <input
                  type="number"
                  step="0.01"
                  value={editValues.precio}
                  onChange={(e) =>
                    setEditValues((p) => ({ ...p, precio: e.target.value }))
                  }
                  disabled={savingEdit}
                />

                <div className="extras-acciones">
                  <button
                    className="btn-verde"
                    type="button"
                    onClick={guardarEdicion}
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Guardando…" : "Guardar"}
                  </button>

                  <button
                    className="btn-gris"
                    type="button"
                    onClick={cancelarEdicion}
                    disabled={savingEdit}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="extra-info">
                  {extra.nombre} - {to2(extra.precio).toFixed(2)} €
                </span>

                <div className="extras-acciones">
                  <button
                    className="btn-gris"
                    type="button"
                    onClick={() => iniciarEdicion(extra)}
                    disabled={disabledGlobal}
                  >
                    Editar
                  </button>

                  <button
                    className="btn-rojo"
                    type="button"
                    onClick={() => confirmarEliminar(extra)}
                    disabled={disabledGlobal}
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* CREAR */}
      <div className="crear-extra">
        <h3>Crear nuevo extra</h3>

        <input
          type="text"
          placeholder="Nombre"
          value={nuevoExtra.nombre}
          onChange={(e) =>
            setNuevoExtra((p) => ({ ...p, nombre: e.target.value }))
          }
          disabled={savingCreate}
        />

        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={nuevoExtra.precio}
          onChange={(e) =>
            setNuevoExtra((p) => ({ ...p, precio: e.target.value }))
          }
          disabled={savingCreate}
        />

        <button
          type="button"
          className="btn-verde"
          onClick={handleCrearExtra}
          disabled={savingCreate}
        >
          {savingCreate ? "Creando…" : "Crear"}
        </button>
      </div>

      {/* MODAL ELIMINACIÓN */}
      {mostrarModal && (
        <ModalConfirmacion
          titulo="Eliminar extra"
          mensaje={`¿Seguro que deseas eliminar "${extraAEliminar?.nombre}"?`}
          onConfirm={ejecutarEliminacion}
          onClose={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
}
