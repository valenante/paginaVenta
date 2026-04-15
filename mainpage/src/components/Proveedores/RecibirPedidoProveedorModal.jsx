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
            precioUnitarioReal: "",
            caducidad: "",
            codigoLote: "",
            ingredienteId: l.ingredienteId || null,
            productoShopId: l.productoShopId || null,
            nombre: l.nombre,
            unidad: l.unidad,
        }))
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const updateLineaCampo = (idx, campo, value) => {
        setLineas((ls) =>
            ls.map((l, i) =>
                i === idx ? { ...l, [campo]: value } : l
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
                    lineas: lineas.map((l) => {
                        const payload = {
                            lineaIndex: l.lineaIndex,
                            cantidadRecibida: Number(l.cantidadRecibida || 0),
                            ingredienteId: l.ingredienteId,
                            productoShopId: l.productoShopId,
                        };
                        // Fase 0/5: campos opcionales
                        if (l.precioUnitarioReal !== "" && l.precioUnitarioReal != null) {
                            payload.precioUnitarioReal = Number(l.precioUnitarioReal);
                        }
                        if (l.caducidad) payload.caducidad = l.caducidad;
                        if (l.codigoLote) payload.codigoLote = l.codigoLote;
                        return payload;
                    }),
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
                                        <th>Precio real (€)</th>
                                        <th>Caducidad</th>
                                        <th>Cód. lote</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lineas.map((l, idx) => (
                                        <tr key={idx}>
                                            <td className="ppRec-name">
                                                {l.nombre}
                                                <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>{l.unidad || ""}</div>
                                            </td>
                                            <td>{l.cantidadPedida}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={l.cantidadPedida}
                                                    value={l.cantidadRecibida}
                                                    onChange={(e) =>
                                                        updateLineaCampo(idx, "cantidadRecibida", Number(e.target.value))
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    placeholder="—"
                                                    value={l.precioUnitarioReal}
                                                    onChange={(e) =>
                                                        updateLineaCampo(idx, "precioUnitarioReal", e.target.value)
                                                    }
                                                    title="Déjalo vacío si coincide con el pedido"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    value={l.caducidad}
                                                    onChange={(e) =>
                                                        updateLineaCampo(idx, "caducidad", e.target.value)
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    placeholder="—"
                                                    value={l.codigoLote}
                                                    onChange={(e) =>
                                                        updateLineaCampo(idx, "codigoLote", e.target.value)
                                                    }
                                                />
                                            </td>
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
                                className="btn btn-primario "
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
