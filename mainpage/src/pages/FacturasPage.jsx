import React, { useEffect, useState } from "react";
import api from "../utils/api";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as logger from "../utils/logger";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";

import "../styles/FacturasPage.css";

export default function FacturasPage() {
    const [facturas, setFacturas] = useState([]);
    const [filtroAnio, setFiltroAnio] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mensajeAlerta, setMensajeAlerta] = useState(null);
    const [subtipo, setSubtipo] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [facturaAAnular, setFacturaAAnular] = useState(null);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Formulario rectificación:
    const [tipo, setTipo] = useState("");
    const [clienteNombre, setClienteNombre] = useState("");
    const [clienteNIF, setClienteNIF] = useState("");
    const [importeTotal, setImporteTotal] = useState("");
    const [motivo, setMotivo] = useState("");

    // ============================
    // Cargar facturasz
    // ============================
    const cargarFacturas = async () => {
        try {
            const { data } = await api.get(`/facturas/facturas-encadenadas?page=${pagina}`);
            setFacturas(data.facturas);
            setTotalPaginas(data.totalPaginas);
        } catch (error) {
            logger.error("Error al cargar facturas:", error);
        }
    };

    useEffect(() => {
        cargarFacturas();
    }, []);

    useEffect(() => {
        cargarFacturas();
    }, [pagina]);

    // ============================
    // Rectificación
    // ============================
    const abrirModalRectificacion = (id) => {
        setFacturaSeleccionada(id);
        setMostrarModal(true);
    };

    const confirmarRectificacion = async () => {
        try {
            const { data } = await api.post(`/facturas/rectificar/${facturaSeleccionada}`, {
                tipoFactura: tipo,
                tipoRectificativa: ["R1", "R2"].includes(tipo) ? subtipo : null,
                clienteNombre,
                clienteNIF,
                importeTotal: parseFloat(importeTotal),
                motivo,
            });

            setMensajeAlerta({
                tipo: "exito",
                mensaje: `Factura rectificativa emitida correctamente: Nº ${data.facturaRectificativa.numeroFactura}`,
            });

            cargarFacturas();
        } catch (error) {
            setMensajeAlerta({
                tipo: "error",
                mensaje: error.response?.data?.error ?? "Hubo un problema al rectificar la factura.",
            });
        } finally {
            setMostrarModal(false);
        }
    };

    // ============================
    // Anular factura
    // ============================
    const anularFactura = async (id) => {
        try {
            const { data } = await api.post(`/facturas/anular/${id}`);
            setMensajeAlerta({
                tipo: "exito",
                mensaje: `Factura anulada correctamente: Nº ${data.numeroFactura}`,
            });
            cargarFacturas();
        } catch (error) {
            setMensajeAlerta({
                tipo: "error",
                mensaje: error.response?.data?.error ?? "No se pudo anular la factura.",
            });
        }
    };

    // ============================
    // Formatear búsquedas
    // ============================
    const normaliza = (s) => (s ?? "").toString().toLowerCase();

    const facturasFiltradas = facturas.filter((f) => {
        const fecha = new Date(f.fechaExpedicion);

        const enRango =
            (!fechaInicio || fecha >= new Date(fechaInicio)) &&
            (!fechaFin || fecha <= new Date(fechaFin + "T23:59:59"));

        const anioOk =
            !filtroAnio ||
            new Date(f.fechaExpedicion).getFullYear().toString() === filtroAnio;

        const q = normaliza(busqueda);

        const matchTexto =
            !q ||
            normaliza(f.numeroFactura).includes(q) ||
            normaliza(f.clienteNIF).includes(q) ||
            normaliza(f.hash ?? f.hashFactura).includes(q);

        return enRango && anioOk && matchTexto;
    });

    // ============================
    // Exportaciones
    // ============================
    const exportarCSV = () => {
        const csv = Papa.unparse(
            facturasFiltradas.map((f) => ({
                "Número factura": f.numeroFactura,
                "Fecha emisión": new Date(f.fechaExpedicion).toLocaleString("es-ES"),
                "Cliente": f.clienteNombre || "-",
                "NIF": f.clienteNIF || "-",
                "Importe total (€)": f.importeTotal?.toFixed(2),
                "Estado": f.estado || "-",
                "Hash": f.hash ?? f.hashFactura,
            }))
        );

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `facturas_${fechaInicio || "todo"}_${fechaFin || "todo"}.csv`;
        link.click();
    };

    const exportarPDF = () => {
        const doc = new jsPDF({ orientation: "landscape" });

        doc.setFontSize(14);
        doc.text("Facturas Encadenadas", 14, 15);

        autoTable(doc, {
            startY: 28,
            head: [["Número", "Fecha", "Cliente", "NIF", "Importe (€)", "Estado", "Hash"]],
            body: facturasFiltradas.map((f) => [
                f.numeroFactura,
                new Date(f.fechaExpedicion).toLocaleString("es-ES"),
                f.clienteNombre || "-",
                f.clienteNIF || "-",
                f.importeTotal?.toFixed(2),
                f.estado || "-",
                f.hash ?? f.hashFactura,
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save(`facturas_${fechaInicio || "todo"}_${fechaFin || "todo"}.pdf`);
    };

    // ============================
    // Ver XML
    // ============================
    const verXML = (xmlBase64) => {
        if (!xmlBase64) {
            return setMensajeAlerta({
                tipo: "error",
                mensaje: "Esta factura no contiene XML firmado.",
            });
        }

        try {
            const xml = atob(xmlBase64);
            const blob = new Blob([xml], { type: "application/xml" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch {
            setMensajeAlerta({
                tipo: "error",
                mensaje: "No se pudo abrir el XML.",
            });
        }
    };

    // ============================
    // Ver Respuesta AEAT
    // ============================
    const verRespuestaAEAT = (respuesta) => {
        if (!respuesta) {
            return setMensajeAlerta({
                tipo: "error",
                mensaje: "Esta factura no tiene respuesta de la AEAT.",
            });
        }

        try {
            const pretty =
                typeof respuesta === "string"
                    ? respuesta
                    : JSON.stringify(respuesta, null, 2);

            const blob = new Blob([pretty], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch {
            setMensajeAlerta({
                tipo: "error",
                mensaje: "No se pudo mostrar la respuesta de la AEAT.",
            });
        }
    };

    return (
        <main className="facturaspage section section--wide">
            {/* HEADER */}
            <header className="facturaspage-header">
                <div>
                    <h1>📄 Facturas Encadenadas</h1>
                    <p>Consulta, exporta y gestiona tu historial fiscal.</p>
                </div>
            </header>

            {/* FILTROS */}
            <section className="facturaspage-card">
                <div className="facturaspage-card-header">
                    <h2>Filtros</h2>
                    <p className="facturaspage-card-subtitle">
                        Filtra por fechas, año, cliente o hash.
                    </p>
                </div>

                <div className="facturaspage-filtros-grid">
                    <div className="config-field">
                        <label>Año</label>
                        <input
                            type="number"
                            value={filtroAnio}
                            onChange={(e) => setFiltroAnio(e.target.value)}
                        />
                    </div>

                    <div className="config-field">
                        <label>Desde</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                    </div>

                    <div className="config-field">
                        <label>Hasta</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                    </div>

                    <div className="config-field">
                        <label>Buscar</label>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Nº factura, hash, NIF..."
                        />
                    </div>
                </div>
            </section>

            {/* ACCIONES */}
            <section className="facturaspage-actions">
                <button className="btn btn-secundario" onClick={exportarCSV}>
                    📤 Exportar CSV
                </button>
                <button className="btn-primario" onClick={exportarPDF}>
                    📄 Exportar PDF
                </button>
            </section>

            {/* ============================
        LISTADO DESKTOP / TPV
    ============================ */}
            <section className="facturaspage-card facturaspage-desktop">
                <div className="facturaspage-card-header">
                    <h2>Listado de Facturas</h2>
                </div>

                <div className="facturaspage-table-wrapper">
                    <table className="facturaspage-table">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Número</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>NIF</th>
                                <th>Importe</th>
                                <th>Hash</th>
                                <th className="acciones-sticky">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {facturasFiltradas.map((f) => (
                                <tr key={f._id}>
                                    <td>
                                        <span className={`estado-factura ${f.estado}`}>
                                            {f.estado}
                                        </span>
                                    </td>
                                    <td>{f.numeroFactura}</td>
                                    <td>
                                        {new Date(f.fechaExpedicion).toLocaleString("es-ES")}
                                    </td>
                                    <td>{f.clienteNombre || "-"}</td>
                                    <td>{f.clienteNIF || "-"}</td>
                                    <td>{f.importeTotal} €</td>
                                    <td className="facturaspage-hash">
                                        {f.hash}
                                    </td>

                                    <td className="acciones-sticky">
                                        <div className="facturaspage-table-actions">
                                            <button onClick={() => abrirModalRectificacion(f._id)}>
                                                ✏️ Rectificar
                                            </button>

                                            {f.estado !== "anulada" && (
                                                <button
                                                    className="danger"
                                                    onClick={() => {
                                                        setFacturaAAnular(f._id);
                                                        setMostrarConfirmacion(true);
                                                    }}
                                                >
                                                    🗑 Anular
                                                </button>
                                            )}

                                            <button onClick={() => verXML(f.xmlFirmado)}>
                                                📄 XML
                                            </button>

                                            {f.respuestaAEAT && (
                                                <button onClick={() => verRespuestaAEAT(f.respuestaAEAT)}>
                                                    🏛 AEAT
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {totalPaginas > 1 && (
                        <div className="facturaspage-pagination">
                            <button
                                disabled={pagina === 1}
                                onClick={() => setPagina(pagina - 1)}
                            >
                                ← Anterior
                            </button>
                            <span>
                                Página {pagina} de {totalPaginas}
                            </span>
                            <button
                                disabled={pagina === totalPaginas}
                                onClick={() => setPagina(pagina + 1)}
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ============================
        LISTADO MÓVIL (CARDS)
    ============================ */}
            <section className="facturaspage-mobile">
                {facturasFiltradas.map((f) => (
                    <div key={f._id} className="factura-card">
                        <div className="factura-card-header">
                            <span className={`estado-factura ${f.estado}`}>
                                {f.estado}
                            </span>
                            <strong>{f.numeroFactura}</strong>
                        </div>

                        <div className="factura-card-body">
                            <div><strong>Fecha:</strong> {new Date(f.fechaExpedicion).toLocaleDateString("es-ES")}</div>
                            <div><strong>Cliente:</strong> {f.clienteNombre || "Consumidor final"}</div>
                            <div><strong>Importe:</strong> {f.importeTotal} €</div>
                        </div>

                        <div className="factura-card-actions">
                            <button onClick={() => abrirModalRectificacion(f._id)}>
                                ✏️ Rectificar
                            </button>

                            {f.estado !== "anulada" && (
                                <button
                                    className="danger"
                                    onClick={() => {
                                        setFacturaAAnular(f._id);
                                        setMostrarConfirmacion(true);
                                    }}
                                >
                                    🗑 Anular
                                </button>
                            )}

                            <button onClick={() => verXML(f.xmlFirmado)}>
                                📄 XML
                            </button>

                            {f.respuestaAEAT && (
                                <button onClick={() => verRespuestaAEAT(f.respuestaAEAT)}>
                                    🏛 AEAT
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </section>

            {/* MODALES */}
            {mostrarModal && (
                <div className="modal-overlay_facturaspage">
                    <div className="modal-contenido_facturaspage">
                        <h2>Rectificar factura</h2>

                        <div className="config-field">
                            <label>Tipo</label>
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                                <option value="">-- Selecciona --</option>
                                <option value="R1">R1 – Sustitución</option>
                                <option value="R2">R2 – Diferencias</option>
                                <option value="R3">R3 – Devolución</option>
                                <option value="R4">R4 – Descuento</option>
                                <option value="R5">R5 – Simplificada</option>
                            </select>
                        </div>

                        {["R1", "R2"].includes(tipo) && (
                            <div className="config-field">
                                <label>Subtipo</label>
                                <select value={subtipo} onChange={(e) => setSubtipo(e.target.value)}>
                                    <option value="">-- Selecciona --</option>
                                    <option value="S">S – Sustitución</option>
                                    <option value="I">I – Diferencias</option>
                                </select>
                            </div>
                        )}

                        <div className="config-field">
                            <label>Nombre</label>
                            <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
                        </div>

                        <div className="config-field">
                            <label>NIF</label>
                            <input value={clienteNIF} onChange={(e) => setClienteNIF(e.target.value)} />
                        </div>

                        <div className="config-field">
                            <label>Importe</label>
                            <input
                                type="number"
                                value={importeTotal}
                                onChange={(e) => setImporteTotal(e.target.value)}
                            />
                        </div>

                        <div className="config-field">
                            <label>Motivo</label>
                            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                        </div>

                        <div className="modal-botones_facturaspage">
                            <button onClick={() => setMostrarModal(false)}>Cancelar</button>
                            <button
                                className="btn-primario"
                                onClick={confirmarRectificacion}
                                disabled={!tipo || (["R1", "R2"].includes(tipo) && !subtipo)}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mensajeAlerta && (
                <AlertaMensaje
                    tipo={mensajeAlerta.tipo}
                    mensaje={mensajeAlerta.mensaje}
                    onClose={() => setMensajeAlerta(null)}
                />
            )}

            {mostrarConfirmacion && (
                <ModalConfirmacion
                    titulo="Confirmar anulación"
                    mensaje="Esta acción no se puede deshacer."
                    onConfirm={() => {
                        anularFactura(facturaAAnular);
                        setMostrarConfirmacion(false);
                    }}
                    onClose={() => setMostrarConfirmacion(false)}
                />
            )}
        </main>
    );
}
