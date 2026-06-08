// src/components/Extras/ExtrasPanel.jsx  ✅ PRODUCCIÓN
// UI unificada con Platos/Bebidas: tarjetas estilo producto (.catpanel-product*) +
// modal de crear/editar (.catmodal-*). "Diferencias obvias" del extra: precio único
// y opción de descontar stock de un producto. Mantiene la lógica de datos:
//  - Optimistic UI en crear/editar/eliminar + revalidación silenciosa
//  - Soft delete (activo=false) y oculta desactivados
//  - AbortController para evitar races en el fetch
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";
import "./ExtrasPanel.css";
import "../Categories/CategoriasPanel.css"; // reutiliza .catpanel-product*
import ModalConfirmacion from "../Modal/ModalConfirmacion";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import ExtraFormModal from "./ExtraFormModal";
import { ProductosContext } from "../../context/ProductosContext";

const byCreatedDesc = (a, b) => {
  const da = new Date(a?.createdAt || 0).getTime();
  const db = new Date(b?.createdAt || 0).getTime();
  return db - da;
};

export default function ExtrasPanel({ onBack, inline, onExtrasCountChange, nuevoExtraSignal = 0 }) {
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // null = cerrado · "NEW" = crear · objeto = editar
  const [modalExtra, setModalExtra] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [extraAEliminar, setExtraAEliminar] = useState(null);

  const abortRef = useRef(null);

  // Catálogo de productos para vincular stock
  const productosCtx = useContext(ProductosContext);
  const productosDisponibles = productosCtx?.productos || [];
  const productosOrdenados = useMemo(
    () => productosDisponibles.slice().sort((a, b) =>
      String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es")
    ),
    [productosDisponibles]
  );
  const productoById = useMemo(() => {
    const m = new Map();
    for (const p of productosOrdenados) m.set(String(p._id), p);
    return m;
  }, [productosOrdenados]);

  const extrasVisibles = useMemo(() => {
    const arr = Array.isArray(extras) ? extras : [];
    return arr.filter((e) => e?.activo !== false).slice().sort(byCreatedDesc);
  }, [extras]);

  // ========= Fetch (seguro, sin races) =========
  const fetchExtras = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const res = await api.get("/extras", { signal: ac.signal });
      const raw = res.data;
      const data = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data?.items) ? raw.data.items
          : Array.isArray(raw?.data) ? raw.data
            : Array.isArray(raw?.items) ? raw.items
              : [];
      setExtras(data);
      if (onExtrasCountChange) onExtrasCountChange(data.filter((e) => e.activo !== false).length);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setAlerta({
        tipo: "error",
        mensaje: err?.response?.data?.mensaje || err?.response?.data?.error || "No se pudieron cargar los extras.",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtras();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  // Abrir el modal de "Nuevo extra" cuando el header del panel lo pide (signal del padre)
  const lastSignal = useRef(0);
  useEffect(() => {
    if (nuevoExtraSignal && nuevoExtraSignal !== lastSignal.current) {
      lastSignal.current = nuevoExtraSignal;
      setModalExtra("NEW");
    }
  }, [nuevoExtraSignal]);

  // ========= Guardar (crear / editar) con optimistic UI =========
  // Lanza el error hacia el modal (que lo muestra) y revierte el estado.
  const saveExtra = async (values, id) => {
    const stockPayload = values.consumeStock && values.productoId
      ? { consumeStock: true, productoId: values.productoId, cantidad: values.cantidad }
      : { consumeStock: false, productoId: null, cantidad: 1 };

    if (id) {
      const prevSnapshot = extras;
      setExtras((prev) => (Array.isArray(prev) ? prev : []).map((x) =>
        x._id === id ? { ...x, nombre: values.nombre, precio: values.precio, ...stockPayload } : x
      ));
      try {
        const res = await api.put(`/extras/${id}`, { nombre: values.nombre, precio: values.precio, ...stockPayload });
        const updated = res.data?.extra || res.data;
        setExtras((prev) => (Array.isArray(prev) ? prev : []).map((x) => (x._id === id ? updated : x)));
        setAlerta({ tipo: "exito", mensaje: "Extra actualizado." });
        fetchExtras({ silent: true });
      } catch (err) {
        setExtras(prevSnapshot);
        throw err;
      }
    } else {
      const tempId = `temp_${Date.now()}`;
      const optimistic = {
        _id: tempId, nombre: values.nombre, precio: values.precio, activo: true,
        ...stockPayload, createdAt: new Date().toISOString(), __optimistic: true,
      };
      setExtras((prev) => [optimistic, ...(Array.isArray(prev) ? prev : [])]);
      try {
        const payload = { nombre: values.nombre, precio: values.precio };
        if (stockPayload.consumeStock) Object.assign(payload, stockPayload);
        const res = await api.post("/extras", payload);
        const created = res.data?.extra || res.data;
        setExtras((prev) => (Array.isArray(prev) ? prev : []).map((x) => (x._id === tempId ? created : x)));
        setAlerta({ tipo: "exito", mensaje: "Extra creado." });
        fetchExtras({ silent: true });
      } catch (err) {
        setExtras((prev) => (Array.isArray(prev) ? prev : []).filter((x) => x._id !== tempId));
        throw err;
      }
    }
  };

  // ========= Eliminar (soft delete) =========
  const confirmarEliminar = (extra) => {
    setExtraAEliminar(extra);
    setMostrarModal(true);
  };

  const ejecutarEliminacion = async () => {
    if (!extraAEliminar?._id || savingDelete) return;
    setSavingDelete(true);
    const id = extraAEliminar._id;
    const prevSnapshot = extras;
    setExtras((prev) => (Array.isArray(prev) ? prev : []).map((x) => (x._id === id ? { ...x, activo: false } : x)));
    try {
      await api.delete(`/extras/${id}`);
      setAlerta({ tipo: "exito", mensaje: "Extra eliminado." });
      setMostrarModal(false);
      setExtraAEliminar(null);
      fetchExtras({ silent: true });
    } catch (err) {
      setExtras(prevSnapshot);
      setAlerta({
        tipo: "error",
        mensaje: err?.response?.data?.mensaje || err?.response?.data?.error || "No se pudo eliminar el extra.",
      });
    } finally {
      setSavingDelete(false);
    }
  };

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

      {/* Cabecera propia solo si NO está embebido en los tabs de carta */}
      {!inline && (
        <header className="extras-panel-header">
          <div>
            <h2>Extras disponibles</h2>
            <p className="extras-hint">Crea, edita o elimina extras. Los cambios se reflejan al instante.</p>
          </div>
          <div className="extras-header-actions">
            {onBack && <button onClick={onBack} className="btn-gris" disabled={savingDelete}>Volver</button>}
            <button type="button" className="catpanel-btn-new" onClick={() => setModalExtra("NEW")} disabled={savingDelete}>
              + Nuevo extra
            </button>
          </div>
        </header>
      )}

      {/* Lista de extras como tarjetas (mismo look que productos) */}
      <div className="extras-cards">
        {loading && extrasVisibles.length === 0 && (
          <p className="catpanel-products-loading">Cargando extras…</p>
        )}
        {!loading && extrasVisibles.length === 0 && (
          <p className="catpanel-products-empty">No hay extras creados todavía. Crea el primero con “+ Nuevo extra”.</p>
        )}

        {extrasVisibles.map((extra) => {
          const prod = extra.consumeStock && extra.productoId ? productoById.get(String(extra.productoId)) : null;
          return (
            <div className="catpanel-product" key={extra._id}>
              <div className="catpanel-product-info">
                <span className="catpanel-product-nombre">{extra.nombre}</span>
                {prod && (
                  <span className="catpanel-product-desc">
                    Descuenta stock: {prod.nombre} ×{extra.cantidad ?? 1}
                  </span>
                )}
              </div>
              <div className="catpanel-product-meta">
                <span className="catpanel-product-price">{Number(extra.precio || 0).toFixed(2)} €</span>
                <span className="catpanel-product-estado catpanel-product-estado--on">Activo</span>
              </div>
              <div className="catpanel-product-actions">
                <button
                  type="button"
                  className="catpanel-action-btn"
                  onClick={() => setModalExtra(extra)}
                  disabled={extra.__optimistic}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="catpanel-action-btn catpanel-action-btn--del"
                  title="Eliminar extra"
                  onClick={() => confirmarEliminar(extra)}
                  disabled={extra.__optimistic}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal crear / editar */}
      {modalExtra && (
        <ExtraFormModal
          extra={modalExtra === "NEW" ? null : modalExtra}
          productos={productosOrdenados}
          onClose={() => setModalExtra(null)}
          onSave={saveExtra}
        />
      )}

      {/* Confirmar eliminación */}
      {mostrarModal && (
        <ModalConfirmacion
          titulo="Eliminar extra"
          mensaje={`¿Seguro que quieres eliminar “${extraAEliminar?.nombre}”?`}
          textoConfirmar="Eliminar"
          onConfirm={ejecutarEliminacion}
          onClose={() => { setMostrarModal(false); setExtraAEliminar(null); }}
        />
      )}
    </div>
  );
}
