// src/pages/admin/PlanesAdmin/PlanesAdmin.jsx
import { useState, useEffect } from "react";
import api from "../../../utils/api";
import "./planesAdmin.css";

import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion";

import NuevoPlanModal from "./NuevoPlanModal";
import EditarPlanModal from "./EditarPlanModal";

import NuevoFeatureModal from "./NuevoFeatureModal";
import EditarFeatureModal from "./EditarFeatureModal";

// ⬅️ Asegúrate de que esta ruta coincide con tu estructura
import Portal from "../../../components/ui/Portal";

export default function PlanesAdmin() {
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
      const { data } = await api.get("/superadminPlans");
      setPlanes(data);
    } catch (err) {
      alert("❌ Error cargando planes");
    }
  };

  // =====================================================
  // 🔥 CARGAR FEATURES
  // =====================================================
  const cargarFeatures = async () => {
    try {
      const { data } = await api.get("/superadmin/features");
      setFeatures(data);
    } catch (err) {
      alert("❌ Error cargando features");
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
        await api.delete(`/superadminPlans/${modalConfirm.id}`);
        cargarPlanes();
      }

      if (modalConfirm.tipo === "feature") {
        await api.delete(`/superadmin/features/${modalConfirm.id}`);
        cargarFeatures();
      }
    } catch {
      alert("❌ Error eliminando");
    }

    setModalConfirm(null);
  };

  // =====================================================
  // Toggle Feature
  // =====================================================
  const toggleFeature = async (id) => {
    try {
      await api.patch(`/superadmin/features/${id}/toggle`);
      cargarFeatures();
    } catch {
      alert("No se pudo cambiar estado");
    }
  };

  return (
    <div className="planes-wrapper-glass">
      <div className="planes-admin">

        <h1>⚙️ Administración de Planes y Features</h1>

        {/* === TABS === */}
        <div className="tabs">
          <button
            className={tab === "planes" ? "active" : ""}
            onClick={() => setTab("planes")}
          >
            📦 Planes
          </button>

          <button
            className={tab === "features" ? "active" : ""}
            onClick={() => setTab("features")}
          >
            🧩 Features
          </button>
        </div>

        {/* =============================
          TAB 1: PLANES
        ============================= */}
        {tab === "planes" && (
          <div>
            <div className="planes-header">
              <button
                className="btn-primary"
                onClick={() => setModalNuevoPlan(true)}
              >
                ➕ Nuevo Plan
              </button>
            </div>

            <div className="planes-table-wrapper">
              <table className="planes-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Activo</th>
                    <th>Features</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {planes.map((p) => (
                    <tr key={p._id}>
                      <td>{p.nombre}</td>
                      <td>{p.precioMensual}€/mes</td>
                      <td>{p.activo ? "✔" : "✖"}</td>
                      <td>{p.features?.length || 0}</td>
                      <td className="acciones">
                        <button onClick={() => setModalEditarPlan(p)}>✏️ Editar</button>
                        <button
                          className="danger"
                          onClick={() => pedirConfirmacionBorrarPlan(p)}
                        >
                          🗑 Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============================
          TAB 2: FEATURES
        ============================= */}
        {tab === "features" && (
          <div>
            <div className="planes-header">
              <button
                className="btn-primary"
                onClick={() => setModalNuevoFeature(true)}
              >
                ➕ Nueva Feature
              </button>
            </div>

            <div className="planes-table-wrapper">
              <table className="planes-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Clave</th>
                    <th>Categoría</th>
                    <th>Activa</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {features.map((f) => (
                    <tr key={f._id}>
                      <td>{f.nombre}</td>
                      <td>{f.clave}</td>
                      <td>{f.categoria}</td>
                      <td>{f.activa ? "✔" : "✖"}</td>
                      <td className="acciones">
                        <button onClick={() => setModalEditarFeature(f)}>✏️ Editar</button>
                        <button onClick={() => toggleFeature(f._id)}>
                          {f.activa ? "🔒 Desactivar" : "🔓 Activar"}
                        </button>
                        <button
                          className="danger"
                          onClick={() => pedirConfirmacionBorrarFeature(f)}
                        >
                          🗑 Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============================
          MODALES (con PORTAL)
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

      </div>
    </div>
  );
}
