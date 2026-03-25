import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../utils/api";
import { useTenant } from "../../../context/TenantContext";
import { useToast } from "../../../context/ToastContext";
import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion.jsx";
import RecibirPedidoProveedorModal from "../../../components/Proveedores/RecibirPedidoProveedorModal.jsx";
import "./ProveedorPedidoDetallePage.css";

const ESTADO_LABEL = {
  borrador: "Borrador",
  enviado: "Enviado",
  recibido: "Recibido",
  parcial: "Recibido parcial",
  cancelado: "Cancelado",
};

export default function ProveedorPedidoDetallePage() {
    const { proveedorId, pedidoId } = useParams();
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const { showToast } = useToast();

    const headersTenant = useMemo(
        () => (tenantId ? { headers: { "x-tenant-id": tenantId } } : {}),
        [tenantId]
    );

    const [pedido, setPedido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalCancel, setModalCancel] = useState(false);
    const [modalRecibir, setModalRecibir] = useState(false);

    const fetchPedido = async () => {
        try {
            setLoading(true);
            setError("");
            const { data } = await api.get(
                `/admin/proveedores/${proveedorId}/pedidos/${pedidoId}`,
                headersTenant
            );
            setPedido(data?.pedido || null);
        } catch {
            setPedido(null);
            setError("No se pudo cargar el pedido.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedido();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proveedorId, pedidoId]);

    const cancelarPedido = async () => {
        try {
            await api.delete(
                `/admin/proveedores/${proveedorId}/pedidos/${pedidoId}`,
                headersTenant
            );
            navigate(`/configuracion/proveedores/${proveedorId}/pedidos`);
        } catch {
            showToast("Error cancelando pedido.", "error");
        }
    };

    return (
        <main className="provDet-page section section--wide">
            {/* Header */}
            <header className="provDet-header card">
                <div className="provDet-headLeft">
                    <div className="provDet-breadcrumbs">
                        <span className="provDet-crumb">Configuración</span>
                        <span className="provDet-sep">/</span>
                        <Link className="provDet-crumbLink" to={`/configuracion/proveedores/${proveedorId}`}>
                            Proveedores
                        </Link>
                        <span className="provDet-sep">/</span>
                        <Link className="provDet-crumbLink" to={`/configuracion/proveedores/${proveedorId}/pedidos`}>
                            Pedidos
                        </Link>
                        <span className="provDet-sep">/</span>
                        <span className="provDet-crumb is-active">Pedido</span>
                    </div>

                    <h1 className="provDet-title">Pedido proveedor</h1>

                    <div className="provDet-metaRow">
                        <span className={`provDet-pill estado-${pedido?.estado || ""}`}>
                            Estado: <b>{ESTADO_LABEL[pedido?.estado] || pedido?.estado || "—"}</b>
                        </span>
                        <span className="provDet-pill">
                            Fecha:{" "}
                            <b>
                                {pedido?.createdAt
                                    ? new Date(pedido.createdAt).toLocaleDateString()
                                    : "—"}
                            </b>
                        </span>
                    </div>
                </div>

                <div className="provDet-headRight">
                    <div className="provDet-actions">
                        <Link
                            className="btn btn-secundario"
                            to={`/configuracion/proveedores/${proveedorId}/pedidos`}
                        >
                            ← Volver
                        </Link>

                        {["borrador", "enviado"].includes(pedido?.estado) && (
                            <button
                                className="btn btn-primario "
                                onClick={() => setModalRecibir(true)}
                            >
                                📦 Recibir pedido
                            </button>
                        )}

                        {["borrador", "enviado"].includes(pedido?.estado) && (
                            <button
                                className="btn btn-secundario"
                                onClick={() => setModalCancel(true)}
                            >
                                Cancelar pedido
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {error && <div className="provDet-alert provDet-alert--error">❌ {error}</div>}

            {/* Body */}
            <section className="provDet-grid">
                {loading ? (
                    <div className="card provDet-card">
                        <div className="provDet-loading">Cargando pedido…</div>
                    </div>
                ) : !pedido ? (
                    <div className="card provDet-card">
                        <div className="provDet-empty">Pedido no encontrado.</div>
                    </div>
                ) : (
                    <>
                        {/* Líneas */}
                        <div className="card provDet-card provDet-card--full">
                            <h2 className="provDet-cardTitle">Líneas del pedido</h2>

                            <div className="prov-tableWrap">
                                <table className="prov-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Unidad</th>
                                            <th>Formato</th>
                                            <th>Cantidad</th>
                                            <th>Precio</th>
                                            <th>IVA</th>
                                            <th>Total línea</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedido.lineas.map((l) => (
                                            <tr key={l._id}>
                                                <td>
                                                    <div className="prov-name">{l.nombre}</div>
                                                </td>
                                                <td>{l.unidad || "—"}</td>
                                                <td>{l.formato || "—"}</td>
                                                <td>{l.cantidad}</td>
                                                <td>{l.precioUnitario.toFixed(2)} €</td>
                                                <td>{l.iva}%</td>
                                                <td>
                                                    <b>{l.totalLinea.toFixed(2)} €</b>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totales */}
                        <div className="card provDet-card">
                            <h2 className="provDet-cardTitle">Totales</h2>

                            <div className="provDet-row">
                                <span className="provDet-k">Subtotal</span>
                                <span className="provDet-v">
                                    {pedido.subtotal.toFixed(2)} €
                                </span>
                            </div>

                            <div className="provDet-row">
                                <span className="provDet-k">IVA</span>
                                <span className="provDet-v">
                                    {pedido.totalIva.toFixed(2)} €
                                </span>
                            </div>

                            <div className="provDet-row">
                                <span className="provDet-k">Total</span>
                                <span className="provDet-v">
                                    <b>{pedido.total.toFixed(2)} €</b>
                                </span>
                            </div>
                        </div>

                        {/* Notas */}
                        {pedido.notas && (
                            <div className="card provDet-card">
                                <h2 className="provDet-cardTitle">Notas</h2>
                                <pre className="provDet-notes">{pedido.notas}</pre>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Modal cancelar */}
            {modalCancel && (
                <ModalConfirmacion
                    titulo="Cancelar pedido"
                    mensaje="¿Seguro que deseas cancelar este pedido?"
                    onConfirm={cancelarPedido}
                    onClose={() => setModalCancel(false)}
                />
            )}
            {modalRecibir && pedido && (
                <RecibirPedidoProveedorModal
                    pedido={pedido}
                    onClose={() => setModalRecibir(false)}
                    onSaved={() => {
                        setModalRecibir(false);
                        fetchPedido();
                    }}
                />
            )}
        </main>
    );
}
