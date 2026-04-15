import React, { useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useFinanzasAnalyticsProveedor } from "../../../hooks/useFinanzas.js";
import "./ProveedorResumenTab.css";

const eur = (n) =>
  `${Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function rangoPorDefecto() {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
  };
}

export default function ProveedorResumenTab() {
  const { proveedor, loadingProveedor } = useOutletContext();
  const { proveedorId } = useParams();

  const defaults = useMemo(rangoPorDefecto, []);
  const [desde, setDesde] = useState(defaults.desde);
  const [hasta, setHasta] = useState(defaults.hasta);

  const { data: analytics, loading: loadingAnalytics } =
    useFinanzasAnalyticsProveedor({ proveedorId, desde, hasta });

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

      {/* KPIs básicos */}
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

      {/* === Analytics enriquecido === */}
      <div className="card provDet-card provDet-card--full">
        <div className="provDet-analytics-head">
          <h2 className="provDet-cardTitle">📊 Analytics del periodo</h2>
          <div className="provDet-analytics-filtros">
            <label>
              Desde
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </label>
            <label>
              Hasta
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </label>
          </div>
        </div>

        {loadingAnalytics && !analytics ? (
          <div className="provDet-loading">Calculando analytics…</div>
        ) : !analytics ? (
          <div className="provDet-empty">Sin datos.</div>
        ) : (
          <>
            <div className="provDet-analytics-kpis">
              <div className="provDet-akpi">
                <span>Gasto total</span>
                <strong>{eur(analytics.gasto.totalConIva)}</strong>
                <small>Base: {eur(analytics.gasto.baseImponible)}</small>
              </div>
              <div className="provDet-akpi">
                <span>Pagado</span>
                <strong>{eur(analytics.gasto.pagado)}</strong>
                <small>
                  {analytics.gasto.facturas} factura
                  {analytics.gasto.facturas === 1 ? "" : "s"}
                </small>
              </div>
              <div className="provDet-akpi provDet-akpi--warn">
                <span>Pendiente</span>
                <strong>{eur(analytics.gasto.pendiente)}</strong>
              </div>
              <div className="provDet-akpi">
                <span>Ticket medio</span>
                <strong>{eur(analytics.pedidos.ticketMedio)}</strong>
                <small>
                  {analytics.pedidos.recibidos} recibidos ·{" "}
                  {analytics.pedidos.pendientes} pend.
                </small>
              </div>
            </div>

            {/* Tendencia mensual */}
            <div className="provDet-analytics-section">
              <h3>Tendencia mensual</h3>
              {(analytics.tendencia || []).length === 0 ? (
                <div className="provDet-empty">Sin datos mensuales.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analytics.tendencia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" tick={{ fill: "#374151", fontSize: 12 }} />
                    <YAxis
                      yAxisId="gasto"
                      tick={{ fill: "#374151", fontSize: 12 }}
                      tickFormatter={(v) => `${v} €`}
                    />
                    <YAxis
                      yAxisId="pedidos"
                      orientation="right"
                      tick={{ fill: "#374151", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(106, 13, 173, 0.08)" }}
                      formatter={(v, name) => (name === "Gasto" ? eur(v) : v)}
                    />
                    <Legend />
                    <Bar yAxisId="gasto" dataKey="gasto" fill="#6a0dad" name="Gasto" />
                    <Bar yAxisId="pedidos" dataKey="pedidos" fill="#22c55e" name="Pedidos" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tendencia de precios */}
            <div className="provDet-analytics-section">
              <h3>Tendencia de precios</h3>
              {(analytics.tendenciaPrecios || []).length === 0 ? (
                <div className="provDet-empty">
                  No hay suficiente histórico para este periodo.
                </div>
              ) : (
                <div className="provDet-precios-wrap">
                  <table className="provDet-precios">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>1er precio</th>
                        <th>Último</th>
                        <th>Δ</th>
                        <th>Compras</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.tendenciaPrecios.map((p) => (
                        <tr key={p.productoProveedorId} className={`alerta-${p.alerta}`}>
                          <td>
                            <div className="provDet-precio-nombre">{p.nombre}</div>
                            <div className="provDet-precio-sub">{p.unidad}</div>
                          </td>
                          <td>{eur(p.primerPrecioPeriodo)}</td>
                          <td>{eur(p.ultimoPrecioPeriodo)}</td>
                          <td>
                            <span className={`provDet-delta provDet-delta--${p.alerta}`}>
                              {p.deltaPct > 0 ? "▲" : p.deltaPct < 0 ? "▼" : "="}{" "}
                              {Math.abs(p.deltaPct).toFixed(1)}%
                            </span>
                          </td>
                          <td>{p.puntos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
