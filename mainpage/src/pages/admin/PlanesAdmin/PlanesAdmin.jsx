// src/pages/admin/PlanesAdmin/PlanesAdmin.jsx
import { useState, useEffect, useMemo } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import api from "../../../utils/api";
import "./planesAdmin.css";
import { useToast } from "../../../context/ToastContext";
import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion";
import NuevoPlanModal from "./NuevoPlanModal";
import EditarPlanModal from "./EditarPlanModal";
import NuevoFeatureModal from "./NuevoFeatureModal";
import EditarFeatureModal from "./EditarFeatureModal";
import Portal from "../../../components/ui/Portal";

const PAGE_SIZE = 10;

function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="planes-pagination">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}><FiChevronLeft /></button>
      <span className="planes-pagination__info">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><FiChevronRight /></button>
    </div>
  );
}

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

  const [planPage, setPlanPage] = useState(1);
  const [featPage, setFeatPage] = useState(1);

  const cargarPlanes = async () => {
    try {
      const { data } = await api.get("/admin/superadminPlans");
      setPlanes(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch { showToast("Error cargando planes", "error"); }
  };

  const cargarFeatures = async () => {
    try {
      const { data } = await api.get("/admin/superadmin/features");
      setFeatures(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch { showToast("Error cargando features", "error"); }
  };

  useEffect(() => { cargarPlanes(); cargarFeatures(); }, []);

  // Pagination
  const planesTotalPages = Math.ceil(planes.length / PAGE_SIZE) || 1;
  const planesPaged = useMemo(() => {
    const s = (planPage - 1) * PAGE_SIZE;
    return planes.slice(s, s + PAGE_SIZE);
  }, [planes, planPage]);

  const featTotalPages = Math.ceil(features.length / PAGE_SIZE) || 1;
  const featPaged = useMemo(() => {
    const s = (featPage - 1) * PAGE_SIZE;
    return features.slice(s, s + PAGE_SIZE);
  }, [features, featPage]);

  // Confirmations
  const pedirConfirmacionBorrarPlan = (plan) => setModalConfirm({ tipo: "plan", id: plan._id, nombre: plan.nombre });
  const pedirConfirmacionBorrarFeature = (f) => setModalConfirm({ tipo: "feature", id: f._id, nombre: f.nombre });

  const confirmarBorrado = async () => {
    try {
      if (modalConfirm.tipo === "plan") {
        await api.delete(`/admin/superadminPlans/${modalConfirm.id}`);
        cargarPlanes();
      } else {
        await api.delete(`/admin/superadmin/features/${modalConfirm.id}`);
        cargarFeatures();
      }
    } catch { showToast("Error eliminando", "error"); }
    setModalConfirm(null);
  };

  const toggleFeature = async (id) => {
    try { await api.patch(`/admin/superadmin/features/${id}/toggle`); cargarFeatures(); }
    catch { showToast("No se pudo cambiar estado", "error"); }
  };

  return (
    <section className="planes">
      <header className="planes__header">
        <div>
          <h1 className="planes__title">Planes y Features</h1>
          <p className="planes__subtitle">Gestiona planes, precios y catálogo de features.</p>
        </div>
        <div className="planes-tabs" role="tablist">
          <button type="button" className={`planes-tabs__btn ${tab === "planes" ? "is-active" : ""}`}
            onClick={() => setTab("planes")} role="tab" aria-selected={tab === "planes"}>
            Planes
          </button>
          <button type="button" className={`planes-tabs__btn ${tab === "features" ? "is-active" : ""}`}
            onClick={() => setTab("features")} role="tab" aria-selected={tab === "features"}>
            Features
          </button>
        </div>
      </header>

      <div className="planes__content">
        {/* PLANES TAB */}
        {tab === "planes" && (
          <section className="planes-block">
            <header className="planes-block__header">
              <div className="planes-block__header-left">
                <h2 className="planes-block__title">Planes</h2>
                <span className="planes-block__count">{planes.length}</span>
              </div>
              <button type="button" className="planes-btn planes-btn--primary" onClick={() => setModalNuevoPlan(true)}>
                + Nuevo Plan
              </button>
            </header>

            {/* Desktop */}
            <div className="planes-desktop">
              <table className="planes-table">
                <thead className="planes-table__thead">
                  <tr><th>Nombre</th><th>Precio</th><th>Activo</th><th>Features</th><th className="planes-table__thActions">Acciones</th></tr>
                </thead>
                <tbody>
                  {planesPaged.length === 0 ? (
                    <tr><td className="planes-table__empty" colSpan={5}>No hay planes.</td></tr>
                  ) : planesPaged.map((p) => (
                    <tr className="planes-table__row" key={p._id}>
                      <td><span className="planes-name">{p.nombre}</span></td>
                      <td><span className="planes-price">{p.precioMensual} €/mes</span></td>
                      <td><span className={`planes-bool ${p.activo ? "is-true" : "is-false"}`}>{p.activo ? "Si" : "No"}</span></td>
                      <td><span className="planes-count">{p.features?.length || 0}</span></td>
                      <td className="planes-table__cell--actions">
                        <div className="planes-actions">
                          <button className="planes-actions__btn" onClick={() => setModalEditarPlan(p)}>Editar</button>
                          <button className="planes-actions__btn planes-actions__btn--danger" onClick={() => pedirConfirmacionBorrarPlan(p)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="planes-mobile">
              {planesPaged.length === 0 ? (
                <p className="planes-table__empty">No hay planes.</p>
              ) : planesPaged.map((p) => (
                <div className="planes-card" key={p._id}>
                  <div className="planes-card__top">
                    <span className="planes-name">{p.nombre}</span>
                    <span className="planes-price">{p.precioMensual} €/mes</span>
                  </div>
                  <div className="planes-card__tags">
                    <span className={`planes-bool ${p.activo ? "is-true" : "is-false"}`}>{p.activo ? "Activo" : "Inactivo"}</span>
                    <span className="planes-count">{p.features?.length || 0} features</span>
                  </div>
                  <div className="planes-card__actions">
                    <button className="planes-actions__btn" onClick={() => setModalEditarPlan(p)}>Editar</button>
                    <button className="planes-actions__btn planes-actions__btn--danger" onClick={() => pedirConfirmacionBorrarPlan(p)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={planPage} totalPages={planesTotalPages} setPage={setPlanPage} />
          </section>
        )}

        {/* FEATURES TAB */}
        {tab === "features" && (
          <section className="planes-block">
            <header className="planes-block__header">
              <div className="planes-block__header-left">
                <h2 className="planes-block__title">Features</h2>
                <span className="planes-block__count">{features.length}</span>
              </div>
              <button type="button" className="planes-btn planes-btn--primary" onClick={() => setModalNuevoFeature(true)}>
                + Nueva Feature
              </button>
            </header>

            {/* Desktop */}
            <div className="planes-desktop">
              <table className="planes-table">
                <thead className="planes-table__thead">
                  <tr><th>Nombre</th><th>Clave</th><th>Categoría</th><th>Activa</th><th className="planes-table__thActions">Acciones</th></tr>
                </thead>
                <tbody>
                  {featPaged.length === 0 ? (
                    <tr><td className="planes-table__empty" colSpan={5}>No hay features.</td></tr>
                  ) : featPaged.map((f) => (
                    <tr className="planes-table__row" key={f._id}>
                      <td><span className="planes-name">{f.nombre}</span></td>
                      <td><span className="planes-mono">{f.clave}</span></td>
                      <td><span className="planes-pill">{f.categoria}</span></td>
                      <td><span className={`planes-bool ${f.activa ? "is-true" : "is-false"}`}>{f.activa ? "Si" : "No"}</span></td>
                      <td className="planes-table__cell--actions">
                        <div className="planes-actions">
                          <button className="planes-actions__btn" onClick={() => setModalEditarFeature(f)}>Editar</button>
                          <button className="planes-actions__btn" onClick={() => toggleFeature(f._id)}>
                            {f.activa ? "Desactivar" : "Activar"}
                          </button>
                          <button className="planes-actions__btn planes-actions__btn--danger" onClick={() => pedirConfirmacionBorrarFeature(f)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="planes-mobile">
              {featPaged.length === 0 ? (
                <p className="planes-table__empty">No hay features.</p>
              ) : featPaged.map((f) => (
                <div className="planes-card" key={f._id}>
                  <div className="planes-card__top">
                    <span className="planes-name">{f.nombre}</span>
                    <span className={`planes-bool ${f.activa ? "is-true" : "is-false"}`}>{f.activa ? "Activa" : "Inactiva"}</span>
                  </div>
                  <div className="planes-card__tags">
                    <span className="planes-mono">{f.clave}</span>
                    <span className="planes-pill">{f.categoria}</span>
                  </div>
                  <div className="planes-card__actions">
                    <button className="planes-actions__btn" onClick={() => setModalEditarFeature(f)}>Editar</button>
                    <button className="planes-actions__btn" onClick={() => toggleFeature(f._id)}>
                      {f.activa ? "Desactivar" : "Activar"}
                    </button>
                    <button className="planes-actions__btn planes-actions__btn--danger" onClick={() => pedirConfirmacionBorrarFeature(f)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={featPage} totalPages={featTotalPages} setPage={setFeatPage} />
          </section>
        )}
      </div>

      {/* Modales */}
      {modalNuevoPlan && <Portal><NuevoPlanModal onClose={() => setModalNuevoPlan(false)} onSave={cargarPlanes} features={features} /></Portal>}
      {modalEditarPlan && <Portal><EditarPlanModal plan={modalEditarPlan} onClose={() => setModalEditarPlan(null)} onSave={cargarPlanes} features={features} /></Portal>}
      {modalNuevoFeature && <Portal><NuevoFeatureModal onClose={() => setModalNuevoFeature(false)} onSave={cargarFeatures} /></Portal>}
      {modalEditarFeature && <Portal><EditarFeatureModal feature={modalEditarFeature} onClose={() => setModalEditarFeature(null)} onSave={cargarFeatures} /></Portal>}
      {modalConfirm && (
        <Portal>
          <ModalConfirmacion
            titulo={`Eliminar ${modalConfirm.tipo === "plan" ? "Plan" : "Feature"}`}
            mensaje={`¿Eliminar "${modalConfirm.nombre}"? Esta acción no se puede deshacer.`}
            placeholder=""
            onConfirm={confirmarBorrado}
            onClose={() => setModalConfirm(null)}
          />
        </Portal>
      )}
    </section>
  );
}
