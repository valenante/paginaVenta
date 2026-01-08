import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import api from "../../../utils/api";
import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion.jsx";
import FacturaProveedorModal from "../../../components/Proveedores/FacturaProveedorModal.jsx";
import PagarFacturaProveedorModal from "../../../components/Proveedores/PagarFacturaProveedorModal.jsx";

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
    <section className="provDet-grid">
      <div className="card provDet-card provDet-card--full">
        {/* Header */}
        <div className="provTab-header">
          <h2 className="provDet-cardTitle">Facturas</h2>
          <button
            className="btn btn-primario"
            onClick={() => setModalCrear(true)}
          >
            ➕ Nueva factura
          </button>
        </div>

        {/* Estados */}
        {loading && <div className="provDet-loading">Cargando facturas…</div>}

        {error && (
          <div className="provDet-alert provDet-alert--error">
            ❌ {error}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="provDet-empty">
            No hay facturas registradas para este proveedor.
          </div>
        )}

        {/* ======================
            DESKTOP · TABLA
        ====================== */}
        {!loading && items.length > 0 && (
          <div className="prov-tableWrap only-desktop">
            <table className="prov-table">
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
                    <td>{f.numeroFactura}</td>
                    <td>{new Date(f.fechaFactura).toLocaleDateString()}</td>
                    <td>
                      {f.fechaVencimiento
                        ? new Date(f.fechaVencimiento).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <strong>{Number(f.total).toFixed(2)} €</strong>
                    </td>
                    <td>
                      <span className={`badge ${mapEstadoFactura(f.estado)}`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="t-right">
                      <div className="prov-rowActions">
                        {f.documentoUrl && (
                          <a
                            href={f.documentoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost"
                          >
                            📎 Ver
                          </a>
                        )}

                        {f.estado === "pendiente" && (
                          <button
                            className="btn btn-secundario"
                            onClick={() => setModalPagar(f)}
                          >
                            Pagar
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

        {/* ======================
            MOBILE · CARDS
        ====================== */}
        {!loading && items.length > 0 && (
          <div className="prov-mobileList only-mobile">
            {items.map((f) => (
              <div key={f._id} className="prov-mobileCard">
                <div className="prov-mobileHeader">
                  <div className="prov-mobileTitle">
                    Factura {f.numeroFactura}
                  </div>

                  <span className={`badge ${mapEstadoFactura(f.estado)}`}>
                    {f.estado}
                  </span>
                </div>

                <div className="prov-mobileGrid">
                  <div>
                    <span className="k">Fecha</span>
                    <span className="v">
                      {new Date(f.fechaFactura).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="k">Vencimiento</span>
                    <span className="v">
                      {f.fechaVencimiento
                        ? new Date(f.fechaVencimiento).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  <div className="full">
                    <span className="k">Total</span>
                    <span className="v total">
                      {Number(f.total).toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="prov-mobileActions">
                  {f.documentoUrl && (
                    <a
                      href={f.documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                    >
                      📎 Ver
                    </a>
                  )}

                  {f.estado === "pendiente" && (
                    <button
                      className="btn btn-secundario"
                      onClick={() => setModalPagar(f)}
                    >
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            ))}
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

/* Helper de estado */
function mapEstadoFactura(estado) {
  switch (estado) {
    case "pagada":
      return "badge-exito";
    case "pendiente":
      return "badge-aviso";
    case "vencida":
      return "badge-error";
    default:
      return "badge";
  }
}
