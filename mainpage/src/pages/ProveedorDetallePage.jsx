// src/pages/ProveedorDetallePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { useTenant } from "../context/TenantContext";

import ProveedorModal from "../components/Proveedores/ProveedorModal.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";

import "../styles/ProveedorDetallePage.css"; // (opcional) si quieres luego lo maquetamos

export default function ProveedorDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenantId } = useTenant();

  const headersTenant = useMemo(() => {
    return tenantId ? { headers: { "x-tenant-id": tenantId } } : {};
  }, [tenantId]);

  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalEdit, setModalEdit] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);

  const fetchProveedor = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get(`/admin/proveedores/${id}`, headersTenant);

      // backend suele devolver { ok: true, proveedor }
      const p = data?.proveedor || data?.item || data || null;

      setProveedor(p);
    } catch (e) {
      setProveedor(null);
      setError("No se pudo cargar el proveedor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tenantId]);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/proveedores/${id}`, headersTenant);
      // como tu backend “elimina” desactivando, volvemos a la lista
      navigate("/configuracion/proveedores");
    } catch {
      alert("Error eliminando proveedor.");
    }
  };

  const nombre = proveedor?.nombreRestaurante|| proveedor?.razonSocial || "Proveedor";
  const contacto = proveedor?.contacto || {};
  const direccion = proveedor?.direccion || {};
  const condiciones = proveedor?.condicionesPago || {};

  const direccionBonita = () => {
    const parts = [
      direccion?.calle,
      direccion?.codigoPostal,
      direccion?.ciudad,
      direccion?.provincia,
      direccion?.pais,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "—";
  };

  return (
    <main className="provDet-page section section--wide">
      {/* Header */}
      <header className="provDet-header card">
        <div className="provDet-headLeft">
          <div className="provDet-breadcrumbs">
            <span className="provDet-crumb">Configuración</span>
            <span className="provDet-sep">/</span>
            <Link className="provDet-crumbLink" to="/configuracion/proveedores">
              Proveedores
            </Link>
            <span className="provDet-sep">/</span>
            <span className="provDet-crumb is-active">{nombre}</span>
          </div>

          <h1 className="provDet-title">{nombre}</h1>

          <div className="provDet-metaRow">
            <span className="provDet-pill">
              Estado:{" "}
              <b>{proveedor?.activo === false ? "Inactivo" : "Activo"}</b>
            </span>
            <span className="provDet-pill">
              Tipo: <b>{proveedor?.tipo || "—"}</b>
            </span>
            <span className="provDet-pill">
              CIF/NIF: <b>{proveedor?.nif || "—"}</b>
            </span>
          </div>
        </div>

        <div className="provDet-headRight">
          <div className="provDet-actions">
            <Link className="btn-ghost" to="/configuracion/proveedores">
              ← Volver
            </Link>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => setModalEdit(true)}
              disabled={loading || !proveedor}
            >
              ✏️ Editar
            </button>

            <button
              className="btn-danger"
              type="button"
              onClick={() => setModalDelete(true)}
              disabled={loading || !proveedor}
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </header>

      {error && <div className="provDet-alert provDet-alert--error">❌ {error}</div>}

      {/* Body */}
      <section className="provDet-grid">
        {loading ? (
          <div className="card provDet-card">
            <div className="provDet-loading">Cargando proveedor…</div>
          </div>
        ) : !proveedor ? (
          <div className="card provDet-card">
            <div className="provDet-empty">
              No se encontró el proveedor.
            </div>
          </div>
        ) : (
          <>
            {/* Datos básicos */}
            <div className="card provDet-card">
              <h2 className="provDet-cardTitle">Datos</h2>

              <div className="provDet-row">
                <span className="provDet-k">Nombre comercial</span>
                <span className="provDet-v">{proveedor?.nombreRestaurante|| "—"}</span>
              </div>

              <div className="provDet-row">
                <span className="provDet-k">Razón social</span>
                <span className="provDet-v">{proveedor?.razonSocial || "—"}</span>
              </div>

              <div className="provDet-row">
                <span className="provDet-k">CIF/NIF</span>
                <span className="provDet-v">{proveedor?.nif || "—"}</span>
              </div>
            </div>

            {/* Contacto */}
            <div className="card provDet-card">
              <h2 className="provDet-cardTitle">Contacto</h2>

              <div className="provDet-row">
                <span className="provDet-k">Nombre</span>
                <span className="provDet-v">{contacto?.nombre || "—"}</span>
              </div>

              <div className="provDet-row">
                <span className="provDet-k">Email</span>
                <span className="provDet-v">{contacto?.email || "—"}</span>
              </div>

              <div className="provDet-row">
                <span className="provDet-k">Teléfono</span>
                <span className="provDet-v">{contacto?.telefono || "—"}</span>
              </div>
            </div>

            {/* Dirección */}
            <div className="card provDet-card">
              <h2 className="provDet-cardTitle">Dirección</h2>
              <div className="provDet-row">
                <span className="provDet-k">Dirección</span>
                <span className="provDet-v">{direccionBonita()}</span>
              </div>
            </div>

            {/* Condiciones */}
            <div className="card provDet-card">
              <h2 className="provDet-cardTitle">Condiciones</h2>

              <div className="provDet-row">
                <span className="provDet-k">Método de pago</span>
                <span className="provDet-v">{condiciones?.metodo || "—"}</span>
              </div>

              <div className="provDet-row">
                <span className="provDet-k">Plazo (días)</span>
                <span className="provDet-v">
                  {Number.isFinite(condiciones?.plazoDias) ? condiciones.plazoDias : "—"}
                </span>
              </div>

              <div className="provDet-row">
                <span className="provDet-k">IBAN</span>
                <span className="provDet-v">{condiciones?.iban || "—"}</span>
              </div>

              <div className="provDet-row">
                <span className="provDet-k">Lead time</span>
                <span className="provDet-v">
                  {Number.isFinite(proveedor?.leadTimeDias) ? `${proveedor.leadTimeDias} días` : "—"}
                </span>
              </div>
            </div>

            {/* Notas */}
            <div className="card provDet-card provDet-card--full">
              <h2 className="provDet-cardTitle">Notas internas</h2>
              <pre className="provDet-notes">{proveedor?.notas || "—"}</pre>
            </div>
          </>
        )}
      </section>

      {/* Modal editar */}
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

      {/* Modal confirm eliminar */}
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
