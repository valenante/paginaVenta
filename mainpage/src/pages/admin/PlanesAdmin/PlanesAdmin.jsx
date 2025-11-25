import { useState, useEffect } from "react";
import api from "../../../utils/api";
import "./planesAdmin.css";

import NuevoPlanModal from "./NuevoPlanModal";
import EditarPlanModal from "./EditarPlanModal";

import NuevoFeatureModal from "./NuevoFeatureModal";
import EditarFeatureModal from "./EditarFeatureModal";

export default function PlanesAdmin() {
  const [tab, setTab] = useState("planes");

  const [planes, setPlanes] = useState([]);
  const [features, setFeatures] = useState([]);

  const [modalNuevoPlan, setModalNuevoPlan] = useState(false);
  const [modalEditarPlan, setModalEditarPlan] = useState(null);

  const [modalNuevoFeature, setModalNuevoFeature] = useState(false);
  const [modalEditarFeature, setModalEditarFeature] = useState(null);

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
  // 🔥 ELIMINAR PLAN
  // =====================================================
  const borrarPlan = async (id) => {
    if (!confirm("¿Eliminar este plan?")) return;

    try {
      await api.delete(`/superadminPlans/${id}`);
      cargarPlanes();
    } catch {
      alert("Error eliminando plan.");
    }
  };

  // =====================================================
  // 🔥 ELIMINAR FEATURE
  // =====================================================
  const borrarFeature = async (id) => {
    if (!confirm("¿Eliminar esta feature?")) return;

    try {
      await api.delete(`/superadmin/features/${id}`);
      cargarFeatures();
    } catch {
      alert("Error eliminando feature.");
    }
  };

  // =====================================================
  // 🔥 TOGGLE FEATURE (activar/desactivar)
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

      {/* ==========================================
         TAB 1 → PLANES
      ========================================== */}
      {tab === "planes" && (
        <div>
          <div className="planes-header">
            <button className="btn-primary" onClick={() => setModalNuevoPlan(true)}>
              ➕ Nuevo Plan
            </button>
          </div>

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
                    <button className="danger" onClick={() => borrarPlan(p._id)}>
                      🗑 eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================
         TAB 2 → FEATURES
      ========================================== */}
      {tab === "features" && (
        <div>
          <div className="planes-header">
            <button className="btn-primary" onClick={() => setModalNuevoFeature(true)}>
              ➕ Nueva Feature
            </button>
          </div>

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
                    <button className="danger" onClick={() => borrarFeature(f._id)}>
                      🗑 eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === Modales === */}
      {modalNuevoPlan && (
        <NuevoPlanModal
          onClose={() => setModalNuevoPlan(false)}
          onSave={cargarPlanes}
          features={features}
        />
      )}

      {modalEditarPlan && (
        <EditarPlanModal
          plan={modalEditarPlan}
          onClose={() => setModalEditarPlan(null)}
          onSave={cargarPlanes}
          features={features}
        />
      )}

      {modalNuevoFeature && (
        <NuevoFeatureModal
          onClose={() => setModalNuevoFeature(false)}
          onSave={cargarFeatures}
        />
      )}

      {modalEditarFeature && (
        <EditarFeatureModal
          feature={modalEditarFeature}
          onClose={() => setModalEditarFeature(null)}
          onSave={cargarFeatures}
        />
      )}
    </div>
  );
}
