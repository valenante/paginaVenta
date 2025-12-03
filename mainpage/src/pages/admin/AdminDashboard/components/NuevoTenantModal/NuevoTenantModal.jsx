// src/pages/admin/AdminDashboard/components/NuevoTenantModal/NuevoTenantModal.jsx

import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import api from "../../../../../utils/api";
import { useTenantForm } from "../../../../../Hooks/useTenantForm";

import Portal from "../../../../../components/ui/Portal";

import PasoDatosBasicos from "./PasoDatosBasicos";
import PasoAdmin from "./PasoAdmin";
import PasoConfigInicial from "./PasoConfigInicial";
import PasoColores from "./PasoColores";
import PasoInfoRestaurante from "./PasoInfoRestaurante";

import "./NuevoTenantModal.css";

Modal.setAppElement("#root"); // puedes dejarlo

export default function NuevoTenantModal({ isOpen, onClose, onCreated }) {
  const { tenant, setTenant, admin, setAdmin, config, setConfig, pago } =
    useTenantForm();

  const [planes, setPlanes] = useState([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // 🔥 Cargar planes reales
  useEffect(() => {
    api
      .get("/publicPlans")
      .then((res) => setPlanes(res.data || []))
      .catch((e) => console.error("Error cargando planes:", e))
      .finally(() => setLoadingPlanes(false));
  }, []);

  // 🚀 Crear tenant
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { tenant, admin, config, pago };

      const { data } = await api.post(
        "/superadmin/crear-tenant-avanzado",
        payload
      );

      setMessage(`✅ Restaurante ${data.tenant.nombre} creado correctamente.`);
      onCreated();

      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error al crear restaurante.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        className="tenantModal-content"
        overlayClassName="tenantModal-overlay"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="tenantModal-title">Nuevo Restaurante</h2>

        <form onSubmit={handleSubmit} className="tenantModal-form">
          <PasoDatosBasicos
            tenant={tenant}
            setTenant={setTenant}
            planes={planes}
            loadingPlanes={loadingPlanes}
          />

          <PasoAdmin admin={admin} setAdmin={setAdmin} />

          <PasoConfigInicial config={config} setConfig={setConfig} />

          <PasoColores config={config} setConfig={setConfig} />

          <PasoInfoRestaurante config={config} setConfig={setConfig} />

          {message && <p className="tenantModal-message">{message}</p>}

          <button
            type="submit"
            className="tenantModal-submit"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Restaurante"}
          </button>
        </form>

        <button className="tenantModal-close" onClick={onClose}>
          Cerrar
        </button>
      </Modal>
    </Portal>
  );
}
