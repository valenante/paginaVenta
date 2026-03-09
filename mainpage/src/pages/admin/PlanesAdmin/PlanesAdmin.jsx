// src/pages/admin/PlanesAdmin/PlanesAdmin.jsx
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import "./planesAdmin.css";
import { useToast } from "../../../context/ToastContext";

import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion";

import NuevoPlanModal from "./NuevoPlanModal";
import EditarPlanModal from "./EditarPlanModal";

import NuevoFeatureModal from "./NuevoFeatureModal";
import EditarFeatureModal from "./EditarFeatureModal";

// ⬅️ Asegúrate de que esta ruta coincide con tu estructura
import Portal from "../../../components/ui/Portal";

export default function PlanesAdmin() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("planes");

  const [planes, setPlanes] = useState([]);
  const [features, setFeatures] = useState([]);

  const [modalNuevoPlan, setModalNuevoPlan] = useState(false);
  const [modalEditarPlan, setModalEditarPlan] = useState(null);

  const [modalNuevoFeature, setModalNuevoFeature] = useState(false);
  const [modalEditarFeature, setModalEditarFeature] = useState(null);

  const [modalConfirm, setModalConfirm] = useState(null);

  // =====================================================
  // 🔥 CARGAR PLANES
  // =====================================================
  const cargarPlanes = async () => {
    try {
      const { data } = await api.get("/admin/superadminPlans");
      setPlanes(data);
    } catch (err) {
      showToast("Error cargando planes", "error");
    }
  };

  // =====================================================
  // 🔥 CARGAR FEATURES
  // =====================================================
  const cargarFeatures = async () => {
    try {
      const { data } = await api.get("/admin/superadmin/features");
      setFeatures(data);
    } catch (err) {
      showToast("Error cargando features", "error");
    }
  };

  useEffect(() => {
    cargarPlanes();
    cargarFeatures();
  }, []);

  // =====================================================
  // CONFIRMACIONES
  // =====================================================
  const pedirConfirmacionBorrarPlan = (plan) => {
    setModalConfirm({
      tipo: "plan",
      id: plan._id,
      nombre: plan.nombre,
    });
  };

  const pedirConfirmacionBorrarFeature = (feature) => {
    setModalConfirm({
      tipo: "feature",
      id: feature._id,
      nombre: feature.nombre,
    });
  };

  const confirmarBorrado = async () => {
    try {
      if (modalConfirm.tipo === "plan") {
        await api.delete(`/admin/superadminPlans/${modalConfirm.id}`);
        cargarPlanes();
      }

      if (modalConfirm.tipo === "feature") {
        await api.delete(`/admin/superadmin/features/${modalConfirm.id}`);
        cargarFeatures();
      }
    } catch {
      showToast("Error eliminando", "error");
    }

    setModalConfirm(null);
  };

  // =====================================================
  // Toggle Feature
  // =====================================================
  const toggleFeature = async (id) => {
    try {
      await api.patch(`/admin/superadmin/features/${id}/toggle`);
      cargarFeatures();
    } catch {
      showToast("No se pudo cambiar estado", "error");
    }
  };

  return (
    <section className="planes">
      <header className="planes__header">
        <div>
          <h1 className="planes__title">⚙️ Administración de Planes y Features</h1>
          <p className="planes__subtitle">
            Gestiona planes, precios y catálogo de features. Todo listo para escalar y vender sin fricción.
          </p>
        </div>

        <div className="planes-tabs" role="tablist" aria-label="Tabs de planes y features">
          <button
            type="button"
            className={`planes-tabs__btn ${tab === "planes" ? "is-active" : ""}`}
            onClick={() => setTab("planes")}
            role="tab"
            aria-selected={tab === "planes"}
          >
            📦 Planes
          </button>

          <button
            type="button"
            className={`planes-tabs__btn ${tab === "features" ? "is-active" : ""}`}
            onClick={() => setTab("features")}
            role="tab"
            aria-selected={tab === "features"}
          >
            🧩 Features
          </button>
        </div>
      </header>

      {/* ====== TAB CONTENT ====== */}
      <div className="planes__content">
        {/* =============================
          TAB 1: PLANES
      ============================= */}
        {tab === "planes" && (
          <section className="planes-block" aria-label="Listado de planes">
            <header className="planes-block__header">
              <h2 className="planes-block__title">Planes</h2>

              <button
                type="button"
                className="planes-btn planes-btn--primary"
                onClick={() => setModalNuevoPlan(true)}
              >
                ➕ Nuevo Plan
              </button>
            </header>

            <div className="planes-tableWrap">
              <table className="planes-table">
                <thead className="planes-table__thead">
                  <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Activo</th>
                    <th>Features</th>
                    <th className="planes-table__thActions">Acciones</th>
                  </tr>
                </thead>

                <tbody className="planes-table__tbody">
                  {planes.length === 0 ? (
                    <tr>
                      <td className="planes-table__empty" colSpan={5}>
                        No hay planes creados todavía.
                      </td>
                    </tr>
                  ) : (
                    planes.map((p) => (
                      <tr className="planes-table__row" key={p._id}>
                        <td className="planes-table__cell" data-label="Nombre">
                          <span className="planes-name">{p.nombre}</span>
                        </td>

                        <td className="planes-table__cell" data-label="Precio">
                          <span className="planes-price">{p.precioMensual}€/mes</span>
                        </td>

                        <td className="planes-table__cell" data-label="Activo">
                          <span className={`planes-bool ${p.activo ? "is-true" : "is-false"}`}>
                            {p.activo ? "✔" : "✖"}
                          </span>
                        </td>

                        <td className="planes-table__cell" data-label="Features">
                          <span className="planes-count">{p.features?.length || 0}</span>
                        </td>

                        <td className="planes-table__cell planes-table__cell--actions" data-label="Acciones">
                          <div className="planes-actions">
                            <button
                              type="button"
                              className="planes-actions__btn"
                              onClick={() => setModalEditarPlan(p)}
                              aria-label="Editar plan"
                              title="Editar"
                            >
                              ✏️ Editar
                            </button>

                            <button
                              type="button"
                              className="planes-actions__btn planes-actions__btn--danger"
                              onClick={() => pedirConfirmacionBorrarPlan(p)}
                              aria-label="Eliminar plan"
                              title="Eliminar"
                            >
                              🗑 Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =============================
          TAB 2: FEATURES
      ============================= */}
        {tab === "features" && (
          <section className="planes-block" aria-label="Listado de features">
            <header className="planes-block__header">
              <h2 className="planes-block__title">Features</h2>

              <button
                type="button"
                className="planes-btn planes-btn--primary"
                onClick={() => setModalNuevoFeature(true)}
              >
                ➕ Nueva Feature
              </button>
            </header>

            <div className="planes-tableWrap">
              <table className="planes-table">
                <thead className="planes-table__thead">
                  <tr>
                    <th>Nombre</th>
                    <th>Clave</th>
                    <th>Categoría</th>
                    <th>Activa</th>
                    <th className="planes-table__thActions">Acciones</th>
                  </tr>
                </thead>

                <tbody className="planes-table__tbody">
                  {features.length === 0 ? (
                    <tr>
                      <td className="planes-table__empty" colSpan={5}>
                        No hay features creadas todavía.
                      </td>
                    </tr>
                  ) : (
                    features.map((f) => (
                      <tr className="planes-table__row" key={f._id}>
                        <td className="planes-table__cell" data-label="Nombre">
                          <span className="planes-name">{f.nombre}</span>
                        </td>

                        <td className="planes-table__cell" data-label="Clave">
                          <span className="planes-mono">{f.clave}</span>
                        </td>

                        <td className="planes-table__cell" data-label="Categoría">
                          <span className="planes-pill">{f.categoria}</span>
                        </td>

                        <td className="planes-table__cell" data-label="Activa">
                          <span className={`planes-bool ${f.activa ? "is-true" : "is-false"}`}>
                            {f.activa ? "✔" : "✖"}
                          </span>
                        </td>

                        <td className="planes-table__cell planes-table__cell--actions" data-label="Acciones">
                          <div className="planes-actions">
                            <button
                              type="button"
                              className="planes-actions__btn"
                              onClick={() => setModalEditarFeature(f)}
                              aria-label="Editar feature"
                              title="Editar"
                            >
                              ✏️ Editar
                            </button>

                            <button
                              type="button"
                              className="planes-actions__btn"
                              onClick={() => toggleFeature(f._id)}
                              aria-label={f.activa ? "Desactivar feature" : "Activar feature"}
                              title={f.activa ? "Desactivar" : "Activar"}
                            >
                              {f.activa ? "🔒 Desactivar" : "🔓 Activar"}
                            </button>

                            <button
                              type="button"
                              className="planes-actions__btn planes-actions__btn--danger"
                              onClick={() => pedirConfirmacionBorrarFeature(f)}
                              aria-label="Eliminar feature"
                              title="Eliminar"
                            >
                              🗑 Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* =============================
        MODALES (Portal)
    ============================= */}
      {modalNuevoPlan && (
        <Portal>
          <NuevoPlanModal
            onClose={() => setModalNuevoPlan(false)}
            onSave={cargarPlanes}
            features={features}
          />
        </Portal>
      )}

      {modalEditarPlan && (
        <Portal>
          <EditarPlanModal
            plan={modalEditarPlan}
            onClose={() => setModalEditarPlan(null)}
            onSave={cargarPlanes}
            features={features}
          />
        </Portal>
      )}

      {modalNuevoFeature && (
        <Portal>
          <NuevoFeatureModal
            onClose={() => setModalNuevoFeature(false)}
            onSave={cargarFeatures}
          />
        </Portal>
      )}

      {modalEditarFeature && (
        <Portal>
          <EditarFeatureModal
            feature={modalEditarFeature}
            onClose={() => setModalEditarFeature(null)}
            onSave={cargarFeatures}
          />
        </Portal>
      )}

      {modalConfirm && (
        <Portal>
          <ModalConfirmacion
            titulo={`Eliminar ${modalConfirm.tipo === "plan" ? "Plan" : "Feature"}`}
            mensaje={`¿Seguro que desea eliminar "${modalConfirm.nombre}"? Esta acción no se puede deshacer.`}
            placeholder=""
            onConfirm={confirmarBorrado}
            onClose={() => setModalConfirm(null)}
          />
        </Portal>
      )}
    </section>
  );
}
