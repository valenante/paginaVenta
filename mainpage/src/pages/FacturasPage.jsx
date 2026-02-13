import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as logger from "../utils/logger";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import FacturasHelpModal from "../components/Facturas/FacturasHelpModal.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import "../styles/FacturasPage.css";

const LIMIT_DEFAULT = 20;

export default function FacturasPage() {
  // ============================
  // State
  // ============================
  const [facturas, setFacturas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalFacturas, setTotalFacturas] = useState(0);

  // filtros (server-side)
  const [filtroAnio, setFiltroAnio] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState(""); // opcional
  const [includeAnulaciones, setIncludeAnulaciones] = useState(false);

  // UI
  const [loadingList, setLoadingList] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  // rectificación
  const [mostrarModal, setMostrarModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null); // objeto factura
  const [tipo, setTipo] = useState("");
  const [subtipo, setSubtipo] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteNIF, setClienteNIF] = useState("");
  const [importeTotal, setImporteTotal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [rectificando, setRectificando] = useState(false);

  // anulación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [facturaAAnular, setFacturaAAnular] = useState(null); // objeto factura
  const [anulandoId, setAnulandoId] = useState(null);

  // debounce búsqueda
  const [debouncedBusqueda, setDebouncedBusqueda] = useState(busqueda);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusqueda(busqueda), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // reset página al cambiar filtros (pro)
  useEffect(() => {
    setPagina(1);
  }, [filtroAnio, debouncedBusqueda, fechaInicio, fechaFin, estado, includeAnulaciones]);

  // ============================
  // Query params (server-side)
  // ============================
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(pagina));
    p.set("limit", String(LIMIT_DEFAULT));

    if (debouncedBusqueda.trim()) p.set("q", debouncedBusqueda.trim());
    if (fechaInicio) p.set("from", fechaInicio);
    if (fechaFin) p.set("to", fechaFin);
    if (filtroAnio) p.set("year", filtroAnio);
    if (estado) p.set("estado", estado);
    if (includeAnulaciones) p.set("includeAnulaciones", "1");

    return p.toString();
  }, [pagina, debouncedBusqueda, fechaInicio, fechaFin, filtroAnio, estado, includeAnulaciones]);

  const exportQueryString = useMemo(() => {
    // igual que queryString pero SIN page/limit
    const p = new URLSearchParams();
    if (debouncedBusqueda.trim()) p.set("q", debouncedBusqueda.trim());
    if (fechaInicio) p.set("from", fechaInicio);
    if (fechaFin) p.set("to", fechaFin);
    if (filtroAnio) p.set("year", filtroAnio);
    if (estado) p.set("estado", estado);
    if (includeAnulaciones) p.set("includeAnulaciones", "1");
    return p.toString();
  }, [debouncedBusqueda, fechaInicio, fechaFin, filtroAnio, estado, includeAnulaciones]);

  // ============================
  // Cargar facturas (server-side)
  // ============================
  const abortRef = useRef(null);

  const cargarFacturas = async () => {
    try {
      setLoadingList(true);

      // cancelar request anterior si existe
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const { data } = await api.get(`/facturas/facturas-encadenadas?${queryString}`, {
        signal: controller.signal,
      });

      setFacturas(data.facturas || []);
      setTotalPaginas(data.totalPaginas || 1);
      setTotalFacturas(data.totalFacturas || 0);
    } catch (error) {
      // si es abort, ignorar
      if (error?.name === "CanceledError" || error?.name === "AbortError") return;

      logger.error("Error al cargar facturas:", error);
      setMensajeAlerta({
        tipo: "error",
        mensaje: "No se pudieron cargar las facturas.",
      });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    cargarFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  // ============================
  // Helpers
  // ============================
  const resetRectificacionForm = () => {
    setTipo("");
    setSubtipo("");
    setClienteNombre("");
    setClienteNIF("");
    setImporteTotal("");
    setMotivo("");
  };

  const abrirModalRectificacion = (factura) => {
    setFacturaSeleccionada(factura);
    // precargar datos (pro)
    setClienteNombre(factura?.clienteNombre || "");
    setClienteNIF(factura?.clienteNIF || "");
    setImporteTotal(
      typeof factura?.importeTotal === "number" ? String(factura.importeTotal) : ""
    );
    setMotivo("");
    setTipo("");
    setSubtipo("");
    setMostrarModal(true);
  };

  const esXMLRaw = (s) => {
    const t = String(s || "").trim();
    return t.startsWith("<") || t.startsWith("<?xml");
  };

  const decodeMaybeBase64 = (s) => {
    const t = String(s || "");
    if (!t) return "";
    if (esXMLRaw(t)) return t; // ya es XML
    // intento base64
    try {
      return atob(t);
    } catch {
      // si no es base64, lo devolvemos igual
      return t;
    }
  };

  // ============================
  // Rectificación
  // ============================
  const confirmarRectificacion = async () => {
    if (!facturaSeleccionada?._id) return;

    // validación mínima
    const imp = Number(importeTotal);
    if (!tipo) {
      return setMensajeAlerta({ tipo: "error", mensaje: "Selecciona un tipo (R1–R5)." });
    }
    if (["R1", "R2"].includes(tipo) && !subtipo) {
      return setMensajeAlerta({ tipo: "error", mensaje: "Selecciona subtipo (S/I) para R1 o R2." });
    }
    if (!Number.isFinite(imp) || imp === 0) {
      return setMensajeAlerta({ tipo: "error", mensaje: "Importe inválido (debe ser distinto de 0)." });
    }
    if (motivo && motivo.length > 500) {
      return setMensajeAlerta({ tipo: "error", mensaje: "Motivo demasiado largo (máx 500)." });
    }

    try {
      setRectificando(true);

      const { data } = await api.post(`/facturas/rectificar/${facturaSeleccionada._id}`, {
        tipoFactura: tipo,
        tipoRectificativa: ["R1", "R2"].includes(tipo) ? subtipo : undefined,
        clienteNombre,
        clienteNIF,
        importeTotal: imp,
        motivo,
      });

      setMensajeAlerta({
        tipo: "exito",
        mensaje: `Factura rectificativa emitida correctamente: Nº ${data?.facturaRectificativa?.numeroFactura}`,
      });

      setMostrarModal(false);
      resetRectificacionForm();
      await cargarFacturas();
    } catch (error) {
      setMensajeAlerta({
        tipo: "error",
        mensaje: error.response?.data?.error ?? "Hubo un problema al rectificar la factura.",
      });
    } finally {
      setRectificando(false);
    }
  };

  // ============================
  // Anular factura
  // ============================
  const solicitarAnulacion = (factura) => {
    setFacturaAAnular(factura);
    setMostrarConfirmacion(true);
  };

  const ejecutarAnulacion = async () => {
    if (!facturaAAnular?._id) return;

    try {
      setAnulandoId(facturaAAnular._id);

      const { data } = await api.post(`/facturas/anular/${facturaAAnular._id}`, {
        motivo: "",
      });

      setMensajeAlerta({
        tipo: "exito",
        mensaje: data?.already
          ? `La factura ya estaba anulada: Nº ${data.numeroFactura}`
          : `Factura anulada correctamente: Nº ${data.numeroFactura}`,
      });

      setMostrarConfirmacion(false);
      setFacturaAAnular(null);
      await cargarFacturas();
    } catch (error) {
      setMensajeAlerta({
        tipo: "error",
        mensaje: error.response?.data?.error ?? "No se pudo anular la factura.",
      });
    } finally {
      setAnulandoId(null);
    }
  };

  // ============================
  // Exportaciones (PRO)
  // - CSV: descarga desde backend (auditoría + filtros reales)
  // - PDF: genera PDF desde el CSV exportado (hasta 10k)
  // ============================
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const exportarCSV = async () => {
    try {
      setExportLoading(true);

      const { data } = await api.get(`/facturas/exportar-csv?${exportQueryString}`, {
        responseType: "blob",
      });

      downloadBlob(
        new Blob([data], { type: "text/csv;charset=utf-8;" }),
        `facturas_${Date.now()}.csv`
      );
    } catch (error) {
      logger.error("Error exportar CSV:", error);
      setMensajeAlerta({
        tipo: "error",
        mensaje: error.response?.data?.error ?? "No se pudo exportar el CSV.",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const exportarPDF = async () => {
    try {
      setExportLoading(true);

      // 1) Pido el CSV (ya viene filtrado y con límite MAX_EXPORT)
      const { data: csvBlob } = await api.get(`/facturas/exportar-csv?${exportQueryString}`, {
        responseType: "blob",
      });

      const csvText = await csvBlob.text();

      // 2) Parseo CSV a rows (Papa)
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const rows = Array.isArray(parsed?.data) ? parsed.data : [];

      if (!rows.length) {
        setMensajeAlerta({ tipo: "error", mensaje: "No hay facturas para exportar a PDF." });
        return;
      }

      // 3) Genero PDF
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("Facturas Encadenadas", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 14, 21);

      autoTable(doc, {
        startY: 28,
        head: [["Número", "Fecha", "Cliente", "NIF", "Importe (€)", "Estado", "Hash"]],
        body: rows.map((r) => [
          r["Número factura"] || r["Número"] || "-",
          r["Fecha emisión"] || r["Fecha"] || "-",
          r["Cliente"] || "-",
          r["NIF"] || "-",
          r["Importe total"] || r["Importe total (€)"] || "-",
          r["Estado"] || "-",
          r["Hash"] || "-",
        ]),
        styles: { fontSize: 8 },
      });

      doc.save(`facturas_${Date.now()}.pdf`);
    } catch (error) {
      logger.error("Error exportar PDF:", error);
      setMensajeAlerta({
        tipo: "error",
        mensaje: "No se pudo exportar el PDF (revisa filtros o tamaño).",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // ============================
  // Ver XML / AEAT
  // ============================
  const verXML = (xmlStored) => {
    if (!xmlStored) {
      return setMensajeAlerta({
        tipo: "error",
        mensaje: "Esta factura no contiene XML firmado.",
      });
    }

    try {
      const xml = decodeMaybeBase64(xmlStored);
      const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setMensajeAlerta({ tipo: "error", mensaje: "No se pudo abrir el XML." });
    }
  };

  const verRespuestaAEAT = (respuesta) => {
    if (!respuesta) {
      return setMensajeAlerta({
        tipo: "error",
        mensaje: "Esta factura no tiene respuesta de la AEAT.",
      });
    }

    try {
      const pretty =
        typeof respuesta === "string" ? respuesta : JSON.stringify(respuesta, null, 2);

      const blob = new Blob([pretty], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setMensajeAlerta({
        tipo: "error",
        mensaje: "No se pudo mostrar la respuesta de la AEAT.",
      });
    }
  };

  const limpiarFiltros = () => {
    setFiltroAnio("");
    setBusqueda("");
    setFechaInicio("");
    setFechaFin("");
    setEstado("");
    setIncludeAnulaciones(false);
  };

  // ============================
  // Render
  // ============================
  return (
    <main className="facturaspage section section--wide">
      {/* HEADER */}
      <header className="facturaspage-header">
        <div className="facturaspage-header-row">
          <div>
            <h1>📄 Facturas Encadenadas</h1>
            <p>Consulta, exporta y gestiona tu historial fiscal.</p>

            <div className="facturaspage-meta">
              <span>
                {loadingList ? "Cargando…" : `Total: ${totalFacturas}`}
              </span>
            </div>
          </div>

          <div className="facturaspage-header-actions">
            <button
              className="facturaspage-help-btn"
              onClick={() => setMostrarAyuda(true)}
              type="button"
              title="Ayuda"
            >
              ℹ️ Ayuda
            </button>
          </div>
        </div>
      </header>

      {/* FILTROS */}
      <section className="facturaspage-card">
        <div className="facturaspage-card-header">
          <h2>Filtros</h2>
          <p className="facturaspage-card-subtitle">
            Filtra por fechas, año, estado, cliente o hash.
          </p>
        </div>

        <div className="facturaspage-filtros-grid">
          <div className="config-field">
            <label>Año</label>
            <input
              type="number"
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value)}
              placeholder="2026"
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
            <label>Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">pendiente</option>
              <option value="enviado">enviado</option>
              <option value="aceptado">aceptado</option>
              <option value="rechazado">rechazado</option>
              <option value="error">error</option>
              <option value="anulada">anulada</option>
              <option value="CORRECTO">CORRECTO</option>
              <option value="INCORRECTO">INCORRECTO</option>
              <option value="ACEPTADO_CON_ERRORES">ACEPTADO_CON_ERRORES</option>
              <option value="correcto">correcto</option>
              <option value="incorrecto">incorrecto</option>
            </select>
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

          <div className="config-field config-field--inline">
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={includeAnulaciones}
                onChange={(e) => setIncludeAnulaciones(e.target.checked)}
              />
              Incluir anulaciones
            </label>
          </div>

          <div className="config-field config-field--inline">
            <button className="btn" type="button" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      {/* ACCIONES */}
      <section className="facturaspage-actions">
        <button className="btn btn-secundario" onClick={exportarCSV} disabled={exportLoading}>
          {exportLoading ? "📤 Exportando…" : "📤 Exportar CSV"}
        </button>
        <button className="btn btn-primario " onClick={exportarPDF} disabled={exportLoading}>
          {exportLoading ? "📄 Generando…" : "📄 Exportar PDF"}
        </button>
      </section>

      {/* LISTADO DESKTOP */}
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
              {!loadingList && facturas.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 18, textAlign: "center" }}>
                    No hay facturas con estos filtros.
                  </td>
                </tr>
              )}

              {facturas.map((f) => (
                <tr key={f._id}>
                  <td>
                    <span className={`estado-factura ${String(f.estado || "").toLowerCase()}`}>
                      {f.estado}
                    </span>
                  </td>
                  <td>{f.numeroFactura}</td>
                  <td>{new Date(f.fechaExpedicion).toLocaleString("es-ES")}</td>
                  <td>{f.clienteNombre || "-"}</td>
                  <td>{f.clienteNIF || "-"}</td>
                  <td>{typeof f.importeTotal === "number" ? `${f.importeTotal.toFixed(2)} €` : "-"}</td>
                  <td className="facturaspage-hash">{f.hash}</td>

                  <td className="acciones-sticky">
                    <div className="facturaspage-table-actions">
                      <button onClick={() => abrirModalRectificacion(f)} disabled={loadingList}>
                        ✏️ Rectificar
                      </button>

                      {f.estado !== "anulada" && (
                        <button
                          className="danger"
                          onClick={() => solicitarAnulacion(f)}
                          disabled={anulandoId === f._id}
                        >
                          {anulandoId === f._id ? "Anulando…" : "🗑 Anular"}
                        </button>
                      )}

                      <button onClick={() => verXML(f.xmlFirmado)} disabled={!f.xmlFirmado}>
                        📄 XML
                      </button>

                      {f.respuestaAEAT ? (
                        <button onClick={() => verRespuestaAEAT(f.respuestaAEAT)}>
                          🏛 AEAT
                        </button>
                      ) : (
                        <button disabled title="Sin respuesta AEAT">
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
              <button disabled={pagina === 1 || loadingList} onClick={() => setPagina(pagina - 1)}>
                ← Anterior
              </button>
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              <button
                disabled={pagina === totalPaginas || loadingList}
                onClick={() => setPagina(pagina + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* LISTADO MÓVIL */}
      <section className="facturaspage-mobile">
        {facturas.map((f) => (
          <div key={f._id} className="factura-card">
            <div className="factura-card-header">
              <span className={`estado-factura ${String(f.estado || "").toLowerCase()}`}>
                {f.estado}
              </span>
              <strong>{f.numeroFactura}</strong>
            </div>

            <div className="factura-card-body">
              <div>
                <strong>Fecha:</strong>{" "}
                {new Date(f.fechaExpedicion).toLocaleDateString("es-ES")}
              </div>
              <div>
                <strong>Cliente:</strong> {f.clienteNombre || "Consumidor final"}
              </div>
              <div>
                <strong>Importe:</strong>{" "}
                {typeof f.importeTotal === "number" ? `${f.importeTotal.toFixed(2)} €` : "-"}
              </div>
            </div>

            <div className="factura-card-actions">
              <button onClick={() => abrirModalRectificacion(f)} disabled={loadingList}>
                ✏️ Rectificar
              </button>

              {f.estado !== "anulada" && (
                <button
                  className="danger"
                  onClick={() => solicitarAnulacion(f)}
                  disabled={anulandoId === f._id}
                >
                  {anulandoId === f._id ? "Anulando…" : "🗑 Anular"}
                </button>
              )}

              <button onClick={() => verXML(f.xmlFirmado)} disabled={!f.xmlFirmado}>
                📄 XML
              </button>

              {f.respuestaAEAT ? (
                <button onClick={() => verRespuestaAEAT(f.respuestaAEAT)}>🏛 AEAT</button>
              ) : (
                <button disabled>🏛 AEAT</button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* MODAL RECTIFICAR */}
      {mostrarModal && (
        <div className="modal-overlay_facturaspage">
          <div className="modal-contenido_facturaspage">
            <h2>Rectificar factura</h2>
            <p style={{ marginTop: 6, opacity: 0.9 }}>
              Factura: <strong>{facturaSeleccionada?.numeroFactura}</strong>
            </p>

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
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setFacturaSeleccionada(null);
                  resetRectificacionForm();
                }}
                disabled={rectificando}
              >
                Cancelar
              </button>

              <button
                className="btn btn-primario "
                onClick={confirmarRectificacion}
                disabled={
                  rectificando ||
                  !tipo ||
                  (["R1", "R2"].includes(tipo) && !subtipo) ||
                  !Number.isFinite(Number(importeTotal)) ||
                  Number(importeTotal) === 0
                }
              >
                {rectificando ? "Confirmando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTA */}
      {mensajeAlerta && (
        <AlertaMensaje
          tipo={mensajeAlerta.tipo}
          mensaje={mensajeAlerta.mensaje}
          onClose={() => setMensajeAlerta(null)}
        />
      )}

      {/* CONFIRM ANULAR */}
      {mostrarConfirmacion && (
        <ModalConfirmacion
          titulo="Confirmar anulación"
          mensaje={`Vas a anular la factura Nº ${facturaAAnular?.numeroFactura}. Esta acción no se puede deshacer.`}
          onConfirm={ejecutarAnulacion}
          onClose={() => {
            setMostrarConfirmacion(false);
            setFacturaAAnular(null);
          }}
        />
      )}

      {/* AYUDA */}
      {mostrarAyuda && <FacturasHelpModal onClose={() => setMostrarAyuda(false)} />}
    </main>
  );
}
