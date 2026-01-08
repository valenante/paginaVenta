import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../../../utils/api";
import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion.jsx";
import PedidoProveedorModal from "../../../components/Proveedores/PedidoProveedorModal.jsx";
import "./ProveedorPedidosTab.css";

export default function ProveedorPedidosTab() {
    const { proveedorId } = useParams();
    const { headersTenant } = useOutletContext();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [modalDelete, setModalDelete] = useState(null);
    const [modalNuevo, setModalNuevo] = useState(false);

    const fetchPedidos = async () => {
        try {
            setLoading(true);
            setError("");
            const { data } = await api.get(
                `/admin/proveedores/${proveedorId}/pedidos`,
                headersTenant
            );
            setItems(data?.items || []);
        } catch {
            setItems([]);
            setError("No se pudieron cargar los pedidos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proveedorId]);

    const handleDelete = async (pedidoId) => {
        try {
            await api.delete(
                `/admin/proveedores/${proveedorId}/pedidos/${pedidoId}`,
                headersTenant
            );
            setModalDelete(null);
            fetchPedidos();
        } catch {
            alert("Error cancelando pedido.");
        }
    };

return (
  <section className="provDet-grid">
    <div className="card provDet-card provDet-card--full">
      {/* Header */}
      <div className="provTab-header">
        <h2 className="provDet-cardTitle">Pedidos al proveedor</h2>

        <button
          className="btn btn-primario"
          onClick={() => setModalNuevo(true)}
        >
          ➕ Nuevo pedido
        </button>
      </div>

      {/* Estados */}
      {loading && (
        <div className="provDet-loading">Cargando pedidos…</div>
      )}

      {error && (
        <div className="provDet-alert provDet-alert--error">
          ❌ {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="provDet-empty">
          No hay pedidos creados para este proveedor.
        </div>
      )}

      {/* DESKTOP */}
      {!loading && items.length > 0 && (
        <div className="prov-tableWrap only-desktop">
          <table className="prov-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th className="t-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <span className={`prov-pill estado-${p.estado}`}>
                      {p.estado}
                    </span>
                  </td>

                  <td>{Number(p.subtotal || 0).toFixed(2)} €</td>
                  <td>{Number(p.totalIva || 0).toFixed(2)} €</td>

                  <td>
                    <strong>
                      {Number(p.total || 0).toFixed(2)} €
                    </strong>
                  </td>

                  <td className="t-right">
                    <div className="prov-rowActions">
                      <Link
                        className="btn btn-ghost"
                        to={`/configuracion/proveedores/${proveedorId}/pedidos/${p._id}`}
                      >
                        Ver
                      </Link>

                      {p.estado === "borrador" && (
                        <button
                          className="btn btn-danger"
                          onClick={() => setModalDelete(p)}
                        >
                          Cancelar
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

      {/* MOBILE */}
      {!loading && items.length > 0 && (
        <div className="prov-mobileList only-mobile">
          {items.map((p) => (
            <div key={p._id} className="prov-mobileCard">
              <div className="prov-mobileHeader">
                <span className="prov-mobileTitle">
                  Pedido ·{" "}
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString()
                    : "—"}
                </span>

                <span className={`prov-pill estado-${p.estado}`}>
                  {p.estado}
                </span>
              </div>

              <div className="prov-mobileGrid">
                <div>
                  <span className="k">Subtotal</span>
                  <span className="v">
                    {Number(p.subtotal || 0).toFixed(2)} €
                  </span>
                </div>

                <div>
                  <span className="k">IVA</span>
                  <span className="v">
                    {Number(p.totalIva || 0).toFixed(2)} €
                  </span>
                </div>

                <div className="full">
                  <span className="k">Total</span>
                  <span className="v total">
                    {Number(p.total || 0).toFixed(2)} €
                  </span>
                </div>
              </div>

              <div className="prov-mobileActions">
                <Link
                  className="btn btn-ghost"
                  to={`/configuracion/proveedores/${proveedorId}/pedidos/${p._id}`}
                >
                  Ver pedido
                </Link>

                {p.estado === "borrador" && (
                  <button
                    className="btn btn-danger"
                    onClick={() => setModalDelete(p)}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Modales */}
    {modalDelete && (
      <ModalConfirmacion
        titulo="Cancelar pedido"
        mensaje="¿Seguro que deseas cancelar este pedido?"
        onConfirm={() => handleDelete(modalDelete._id)}
        onClose={() => setModalDelete(null)}
      />
    )}

    {modalNuevo && (
      <PedidoProveedorModal
        onClose={() => setModalNuevo(false)}
        onSaved={() => {
          setModalNuevo(false);
          fetchPedidos();
        }}
      />
    )}
  </section>
);
}
