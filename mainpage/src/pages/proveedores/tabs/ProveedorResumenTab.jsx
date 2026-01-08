import React from "react";
import { useOutletContext } from "react-router-dom";
import "./ProveedorResumenTab.css";
export default function ProveedorResumenTab() {
  const { proveedor, loadingProveedor } = useOutletContext();

  if (loadingProveedor) {
    return (
      <section className="provDet-grid">
        <div className="card provDet-card">
          <div className="provDet-loading">Cargando proveedor…</div>
        </div>
      </section>
    );
  }

  if (!proveedor) {
    return (
      <section className="provDet-grid">
        <div className="card provDet-card">
          <div className="provDet-empty">Proveedor no encontrado</div>
        </div>
      </section>
    );
  }

  const stats = proveedor.stats || {};

  return (
    <section className="provDet-grid">
      {/* Estado general */}
      <div className="card provDet-card">
        <h2 className="provDet-cardTitle">Estado general</h2>

        <div className="provDet-row">
          <span className="provDet-k">Estado</span>
          <span
            className={`provDet-v provDet-badge ${
              proveedor.activo === false ? "is-off" : "is-on"
            }`}
          >
            {proveedor.activo === false ? "Inactivo" : "Activo"}
          </span>
        </div>

        <div className="provDet-row">
          <span className="provDet-k">Tipo</span>
          <span className="provDet-v">{proveedor.tipo || "—"}</span>
        </div>

        <div className="provDet-row">
          <span className="provDet-k">Lead time</span>
          <span className="provDet-v">
            {Number.isFinite(proveedor.leadTimeDias)
              ? `${proveedor.leadTimeDias} días`
              : "—"}
          </span>
        </div>
      </div>

      {/* Contacto */}
      <div className="card provDet-card">
        <h2 className="provDet-cardTitle">Contacto</h2>

        <div className="provDet-row">
          <span className="provDet-k">Persona</span>
          <span className="provDet-v">
            {proveedor.contacto?.nombre || "—"}
          </span>
        </div>

        <div className="provDet-row">
          <span className="provDet-k">Email</span>
          <span className="provDet-v">
            {proveedor.contacto?.email || "—"}
          </span>
        </div>

        <div className="provDet-row">
          <span className="provDet-k">Teléfono</span>
          <span className="provDet-v">
            {proveedor.contacto?.telefono || "—"}
          </span>
        </div>
      </div>

      {/* Fiscal */}
      <div className="card provDet-card">
        <h2 className="provDet-cardTitle">Datos fiscales</h2>

        <div className="provDet-row">
          <span className="provDet-k">Razón social</span>
          <span className="provDet-v">
            {proveedor.razonSocial || "—"}
          </span>
        </div>

        <div className="provDet-row">
          <span className="provDet-k">CIF / NIF</span>
          <span className="provDet-v">
            {proveedor.nif || "—"}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="card provDet-card provDet-card--full">
        <h2 className="provDet-cardTitle">Actividad</h2>

        <div className="provDet-kpis">
          <div className="provDet-kpi">
            <span className="provDet-kpiLabel">Pedidos</span>
            <span className="provDet-kpiValue">
              {stats.totalPedidos ?? "—"}
            </span>
          </div>

          <div className="provDet-kpi">
            <span className="provDet-kpiLabel">Facturado</span>
            <span className="provDet-kpiValue">
              {Number.isFinite(stats.totalFacturado)
                ? `${stats.totalFacturado.toFixed(2)} €`
                : "—"}
            </span>
          </div>

          <div className="provDet-kpi">
            <span className="provDet-kpiLabel">Pendiente</span>
            <span className="provDet-kpiValue">
              {Number.isFinite(stats.facturasPendientes)
                ? `${stats.facturasPendientes} €`
                : "—"}
            </span>
          </div>

          <div className="provDet-kpi">
            <span className="provDet-kpiLabel">Último pedido</span>
            <span className="provDet-kpiValue">
              {stats.ultimoPedidoAt
                ? new Date(stats.ultimoPedidoAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
