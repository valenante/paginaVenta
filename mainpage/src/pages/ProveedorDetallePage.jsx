// src/pages/ProveedorDetallePage.jsx ✅ PERFECTO (UX Errors PRO)
// - OK/avisos: AlertaMensaje
// - Errores backend: ErrorToast (normalizeApiError)
// - Sin alert() ni setError string legacy
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { useTenant } from "../context/TenantContext";

import ProveedorModal from "../components/Proveedores/ProveedorModal.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";

import "../styles/ProveedorDetallePage.css";

export default function ProveedorDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenantId } = useTenant();

  // ⚠️ Si tu api.js ya mete x-tenant-id automáticamente, puedes borrar esto.
  const headersTenant = useMemo(() => {
    return tenantId ? { headers: { "x-tenant-id": tenantId } } : {};
  }, [tenantId]);

  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);

  // OK / avisos
  const [alerta, setAlerta] = useState(null);

  // KO contrato
  const [errorToast, setErrorToast] = useState(null);

  const [modalEdit, setModalEdit] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);

  const showOk = useCallback((mensaje) => {
    setAlerta({ tipo: "exito", mensaje });
  }, []);

  const showWarn = useCallback((mensaje) => {
    setAlerta({ tipo: "warn", mensaje });
  }, []);

  const showErr = useCallback((err, fallback = "No se pudo completar la operación.") => {
    const n = normalizeApiError(err);
    setErrorToast({ ...n, message: n?.message || fallback });
  }, []);

  const fetchProveedor = useCallback(async () => {
    try {
      setLoading(true);
      setErrorToast(null);

      const { data } = await api.get(`/admin/proveedores/${id}`, headersTenant);

      // backend suele devolver { ok:true, proveedor } o algo similar
      const p = data?.proveedor || data?.item || data || null;

      setProveedor(p);
    } catch (err) {
      setProveedor(null);
      showErr(err, "No se pudo cargar el proveedor.");
    } finally {
      setLoading(false);
    }
  }, [id, headersTenant, showErr]);

  useEffect(() => {
    fetchProveedor();
  }, [fetchProveedor]);

  const handleDelete = async () => {
    try {
      setErrorToast(null);
      await api.delete(`/admin/proveedores/${id}`, headersTenant);

      showOk("Proveedor eliminado (desactivado).");
      // volver a lista
      navigate("/configuracion/proveedores");
    } catch (err) {
      showErr(err, "No se pudo eliminar el proveedor.");
    } finally {
      setModalDelete(false);
    }
  };

  const nombre = proveedor?.nombreRestaurante || proveedor?.razonSocial || "Proveedor";
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

  const onRetry = useCallback(() => {
    fetchProveedor();
  }, [fetchProveedor]);

  return (
    <main className="provDet-page section section--wide">
      {/* ERROR TOAST */}
      {errorToast && (
        <ErrorToast
          error={errorToast}
          onRetry={errorToast.canRetry ? onRetry : undefined}
          onClose={() => setErrorToast(null)}
        />
      )}

      {/* ALERTA OK / avisos */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3400}
        />
      )}

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
              Estado: <b>{proveedor?.activo === false ? "Inactivo" : "Activo"}</b>
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

      {/* Body */}
      <section className="provDet-grid">
        {loading ? (
          <div className="card provDet-card">
            <div className="provDet-loading">Cargando proveedor…</div>
          </div>
        ) : !proveedor ? (
          <div className="card provDet-card">
            <div className="provDet-empty">No se encontró el proveedor.</div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-secundario" onClick={fetchProveedor}>
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Datos básicos */}
            <div className="card provDet-card">
              <h2 className="provDet-cardTitle">Datos</h2>

              <div className="provDet-row">
                <span className="provDet-k">Nombre comercial</span>
                <span className="provDet-v">{proveedor?.nombreRestaurante || "—"}</span>
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
            showOk("Proveedor actualizado.");
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