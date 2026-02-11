import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";

import ProveedorModal from "../../components/Proveedores/ProveedorModal.jsx";
import ModalConfirmacion from "../../components/Modal/ModalConfirmacion.jsx";

import "../../styles/ProveedorDetallePage.css"; // tu css de detalle
import "../../styles/ProveedorDetalleTabs.css"; // lo creamos abajo

export default function ProveedorDetalleLayout() {
  const { proveedorId } = useParams();
  const navigate = useNavigate();
  const { tenantId } = useTenant();

  const headersTenant = useMemo(
    () => (tenantId ? { headers: { "x-tenant-id": tenantId } } : {}),
    [tenantId]
  );

  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalEdit, setModalEdit] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);

  const fetchProveedor = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(
        `/admin/proveedores/${proveedorId}/resumen`,
        headersTenant
      );

      setProveedor({
        ...data.proveedor,
        stats: data.stats,
      });
    } catch (e) {
      console.error("Error cargando proveedor", e);
      setProveedor(null);
      setError("No se pudo cargar el proveedor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedorId, tenantId]);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/proveedores/${proveedorId}`, headersTenant);
      navigate("/configuracion/proveedores");
    } catch {
      alert("Error eliminando proveedor.");
    }
  };

  const nombre = proveedor?.nombreRestaurante|| proveedor?.razonSocial || "Proveedor";

 return (
  <main className="provDet-page section section--wide">
    {/* =========================
        Header
    ========================= */}
    <header className="provDet-header card">
      <div className="provDet-headLeft">
        {/* Breadcrumbs */}
        <nav className="provDet-breadcrumbs">
          <span className="provDet-crumb">Configuración</span>
          <span className="provDet-sep">/</span>
          <Link
            className="provDet-crumbLink"
            to="/configuracion/proveedores"
          >
            Proveedores
          </Link>
          <span className="provDet-sep">/</span>
          <span className="provDet-crumb is-active">
            {nombre}
          </span>
        </nav>

        {/* Title */}
        <h1 className="provDet-title">{nombre}</h1>

        {/* Meta */}
        <div className="provDet-metaRow">
          <span className="provDet-pill">
            Estado:{" "}
            <b>
              {proveedor?.activo === false
                ? "Inactivo"
                : "Activo"}
            </b>
          </span>

          <span className="provDet-pill">
            Tipo: <b>{proveedor?.tipo || "—"}</b>
          </span>

          <span className="provDet-pill">
            CIF/NIF: <b>{proveedor?.nif || "—"}</b>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="provDet-headRight">
        <div className="provDet-actions">
          <Link
            className="btn btn-ghost"
            to="/configuracion/proveedores"
          >
            ← Volver
          </Link>

          <button
            className="btn btn-primario"
            type="button"
            onClick={() => setModalEdit(true)}
            disabled={loading || !proveedor}
          >
            ✏️ Editar
          </button>

          <button
            className="btn btn-danger"
            type="button"
            onClick={() => setModalDelete(true)}
            disabled={loading || !proveedor}
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </header>

    {/* =========================
        Error
    ========================= */}
    {error && (
      <div className="provDet-alert provDet-alert--error">
        ❌ {error}
      </div>
    )}

    {/* =========================
        Tabs
    ========================= */}
    <nav className="provTabs card">
      <NavLink
        end
        to={`/configuracion/proveedores/${proveedorId}`}
        className={({ isActive }) =>
          `provTab ${isActive ? "is-active" : ""}`
        }
      >
        Resumen
      </NavLink>

      <NavLink
        to={`/configuracion/proveedores/${proveedorId}/productos`}
        className={({ isActive }) =>
          `provTab ${isActive ? "is-active" : ""}`
        }
      >
        Productos
      </NavLink>

      <NavLink
        to={`/configuracion/proveedores/${proveedorId}/pedidos`}
        className={({ isActive }) =>
          `provTab ${isActive ? "is-active" : ""}`
        }
      >
        Pedidos
      </NavLink>

      <NavLink
        to={`/configuracion/proveedores/${proveedorId}/facturas`}
        className={({ isActive }) =>
          `provTab ${isActive ? "is-active" : ""}`
        }
      >
        Facturas
      </NavLink>
    </nav>

    {/* =========================
        Tab content
    ========================= */}
    <section className="provDet-content">
      <Outlet
        context={{
          proveedor,
          loadingProveedor: loading,
          headersTenant,
          refetchProveedor: fetchProveedor,
        }}
      />
    </section>

    {/* =========================
        Modales
    ========================= */}
    {modalEdit && proveedor && (
      <ProveedorModal
        mode="edit"
        proveedor={proveedor}
        onClose={() => setModalEdit(false)}
        onSaved={() => {
          setModalEdit(false);
          fetchProveedor();
        }}
      />
    )}

    {modalDelete && proveedor && (
      <ModalConfirmacion
        titulo="Eliminar proveedor"
        mensaje={`¿Seguro que deseas eliminar "${nombre}"? Se desactivará y no aparecerá en listados activos.`}
        onConfirm={handleDelete}
        onClose={() => setModalDelete(false)}
      />
    )}
  </main>
);
}
