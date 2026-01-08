import React, { useMemo, useState } from "react";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
import "./RecibirPedidoProveedorModal.css";

export default function RecibirPedidoProveedorModal({
    pedido,
    onClose,
    onSaved,
}) {
    const { tenantId } = useTenant();
    const proveedorId = pedido.proveedorId;
    const pedidoId = pedido._id;

    const headersTenant = useMemo(
        () => (tenantId ? { headers: { "x-tenant-id": tenantId } } : {}),
        [tenantId]
    );

    const [lineas, setLineas] = useState(
        pedido.lineas.map((l, idx) => ({
            lineaIndex: idx,
            cantidadPedida: l.cantidad,
            cantidadRecibida: l.cantidad,
            ingredienteId: l.ingredienteId || null,
            productoShopId: l.productoShopId || null,
            nombre: l.nombre,
            unidad: l.unidad,
        }))
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const updateLinea = (idx, value) => {
        setLineas((ls) =>
            ls.map((l, i) =>
                i === idx ? { ...l, cantidadRecibida: value } : l
            )
        );
    };

    const submit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            await api.patch(
                `/admin/proveedores/${proveedorId}/pedidos/${pedidoId}/recibir`,
                {
                    lineas: lineas.map((l) => ({
                        lineaIndex: l.lineaIndex,
                        cantidadRecibida: Number(l.cantidadRecibida || 0),
                        ingredienteId: l.ingredienteId,
                        productoShopId: l.productoShopId,
                    })),
                },
                headersTenant
            );

            onSaved?.();
        } catch (e) {
            setError(e?.response?.data?.error || "Error recibiendo el pedido.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Portal>
            <div className="ppRec-backdrop" onMouseDown={onClose}>
                <div
                    className="ppRec card"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* =========================
            Header
        ========================= */}
                    <header className="ppRec-head">
                        <h2 className="ppRec-title">Recibir pedido</h2>

                        <button
                            type="button"
                            className="ppRec-close"
                            onClick={onClose}
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                    </header>

                    {/* =========================
            Body
        ========================= */}
                    <form className="ppRec-body" onSubmit={submit}>
                        {error && (
                            <div className="ppRec-alert badge-error">
                                ❌ {error}
                            </div>
                        )}

                        {/* =========================
              Tabla
          ========================= */}
                        <div className="ppRec-tableWrap">
                            <table className="ppRec-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Pedida</th>
                                        <th>Recibida</th>
                                        <th>Unidad</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lineas.map((l, idx) => (
                                        <tr key={l.lineaId}>
                                            <td className="ppRec-name">{l.nombre}</td>
                                            <td>{l.cantidadPedida}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={l.cantidadPedida}
                                                    value={l.cantidadRecibida}
                                                    onChange={(e) =>
                                                        updateLinea(idx, Number(e.target.value))
                                                    }
                                                />
                                            </td>
                                            <td>{l.unidad || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* =========================
              Footer
          ========================= */}
                        <footer className="ppRec-foot">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primario"
                                disabled={saving}
                            >
                                {saving ? "Recibiendo…" : "Confirmar recepción"}
                            </button>
                        </footer>
                    </form>
                </div>
            </div>
        </Portal>
    );
}
