import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import api from "../../../utils/api";
import FacturaProveedorModal from "../../../components/Proveedores/FacturaProveedorModal.jsx";
import { toImgSrc } from "../../../utils/media";
import PagarFacturaProveedorModal from "../../../components/Proveedores/PagarFacturaProveedorModal.jsx";
import "./ProveedorFacturasTab.css";

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
};

const ESTADO_BADGE = {
  pendiente: "factTab-badge--pendiente",
  pagada: "factTab-badge--pagada",
  vencida: "factTab-badge--vencida",
};

export default function ProveedorFacturasTab() {
  const { proveedorId } = useParams();
  const { headersTenant } = useOutletContext();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalCrear, setModalCrear] = useState(false);
  const [modalPagar, setModalPagar] = useState(null);

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get(
        `/admin/proveedores/${proveedorId}/facturas`,
        headersTenant
      );
      setItems(data?.items || []);
    } catch {
      setItems([]);
      setError("No se pudieron cargar las facturas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, [proveedorId]);

  return (
    <section className="factTab">
      <div className="card factTab-card">
        {/* Header */}
        <div className="factTab-header">
          <h2 className="factTab-title">Facturas</h2>
          <button
            className="btn btn-primario"
            onClick={() => setModalCrear(true)}
          >
            + Nueva factura
          </button>
        </div>

        {/* States */}
        {loading && <div className="factTab-loading">Cargando facturas…</div>}

        {error && <div className="factTab-error">❌ {error}</div>}

        {!loading && items.length === 0 && !error && (
          <div className="factTab-empty">
            No hay facturas registradas para este proveedor.
          </div>
        )}

        {/* ── DESKTOP TABLE ── */}
        {!loading && items.length > 0 && (
          <div className="factTab-tableWrap factTab-desktop">
            <table className="factTab-table">
              <thead>
                <tr>
                  <th>Nº Factura</th>
                  <th>Fecha</th>
                  <th>Vencimiento</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th className="t-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f._id}>
                    <td>{f.numeroFactura || "—"}</td>
                    <td>
                      {f.fechaFactura
                        ? new Date(f.fechaFactura).toLocaleDateString("es-ES")
                        : "—"}
                    </td>
                    <td>
                      {f.fechaVencimiento
                        ? new Date(f.fechaVencimiento).toLocaleDateString("es-ES")
                        : "—"}
                    </td>
                    <td className="factTab-total">
                      {Number(f.total || 0).toFixed(2)} €
                    </td>
                    <td>
                      <span className={`factTab-badge ${ESTADO_BADGE[f.estado] || ""}`}>
                        {ESTADO_LABEL[f.estado] || f.estado}
                      </span>
                    </td>
                    <td className="t-right">
                      <div className="factTab-rowActions">
                        {f.documentoUrl && (
                          <a
                            href={toImgSrc(f.documentoUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost"
                          >
                            📎 Ver
                          </a>
                        )}

                        {f.estado === "pendiente" && (
                          <button
                            className="btn btn-primario"
                            onClick={() => setModalPagar(f)}
                          >
                            Marcar pagada
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── MOBILE CARDS ── */}
        {!loading && items.length > 0 && (
          <div className="factTab-mobile">
            <div className="factTab-mobileList">
              {items.map((f) => (
                <div key={f._id} className="factTab-mobileCard">
                  <div className="factTab-mobileHead">
                    <span className="factTab-mobileName">
                      {f.numeroFactura || "Sin número"}
                    </span>
                    <span className={`factTab-badge ${ESTADO_BADGE[f.estado] || ""}`}>
                      {ESTADO_LABEL[f.estado] || f.estado}
                    </span>
                  </div>

                  <div className="factTab-mobileGrid">
                    <div>
                      <span className="k">Fecha</span>
                      <span className="v">
                        {f.fechaFactura
                          ? new Date(f.fechaFactura).toLocaleDateString("es-ES")
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="k">Vencimiento</span>
                      <span className="v">
                        {f.fechaVencimiento
                          ? new Date(f.fechaVencimiento).toLocaleDateString("es-ES")
                          : "—"}
                      </span>
                    </div>
                    <div className="full">
                      <span className="k">Total</span>
                      <span className="v total">
                        {Number(f.total || 0).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <div className="factTab-mobileActions">
                    {f.documentoUrl && (
                      <a
                        href={toImgSrc(f.documentoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                      >
                        📎 Ver
                      </a>
                    )}
                    {f.estado === "pendiente" && (
                      <button
                        className="btn btn-primario"
                        onClick={() => setModalPagar(f)}
                      >
                        Marcar pagada
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {modalCrear && (
        <FacturaProveedorModal
          onClose={() => setModalCrear(false)}
          onSaved={() => {
            setModalCrear(false);
            fetchFacturas();
          }}
        />
      )}

      {modalPagar && (
        <PagarFacturaProveedorModal
          factura={modalPagar}
          onClose={() => setModalPagar(null)}
          onSaved={() => {
            setModalPagar(null);
            fetchFacturas();
          }}
        />
      )}
    </section>
  );
}
