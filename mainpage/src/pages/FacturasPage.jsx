// src/pages/FacturasPage.jsx  ✅ PERFECTO (UX Errors PRO + AlertaMensaje OK + ErrorToast KO)
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as logger from "../utils/logger";

import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import FacturasHelpModal from "../components/Facturas/FacturasHelpModal.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";

import { normalizeApiError } from "../utils/normalizeApiError.js";
import "../styles/FacturasPage.css";

const LIMIT_DEFAULT = 20;

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  enviado: "Enviado",
  aceptado: "Aceptado",
  correcto: "Correcto",
  rechazado: "Rechazado",
  incorrecto: "Incorrecto",
  error: "Error",
  anulada: "Anulada",
  aceptado_con_errores: "Aceptado con errores",
};

const ESTADO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "enviado", label: "Enviado" },
  { value: "correcto", label: "Correcto (AEAT)" },
  { value: "aceptado", label: "Aceptado" },
  { value: "incorrecto", label: "Incorrecto (AEAT)" },
  { value: "rechazado", label: "Rechazado" },
  { value: "error", label: "Error" },
  { value: "anulada", label: "Anulada" },
];

const TIPO_RECTIFICATIVA = [
  { value: "R1", label: "R1 — Rectificación por sustitución", needsSubtipo: true },
  { value: "R2", label: "R2 — Rectificación por diferencias", needsSubtipo: true },
  { value: "R3", label: "R3 — Rectificación por devolución", needsSubtipo: false },
  { value: "R4", label: "R4 — Rectificación resto", needsSubtipo: false },
  { value: "R5", label: "R5 — Factura rectificativa simplificada", needsSubtipo: false },
];

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
  const [estado, setEstado] = useState("");
  const [includeAnulaciones, setIncludeAnulaciones] = useState(false);
  const [filtroTipoCliente, setFiltroTipoCliente] = useState(""); // "", "consumidor_final", "nominativa"

  // UI
  const [loadingList, setLoadingList] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState(null); // OK / aviso
  const [errorToast, setErrorToast] = useState(null);       // KO (contrato)
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  // rectificación
  const [mostrarModal, setMostrarModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [tipo, setTipo] = useState("");
  const [subtipo, setSubtipo] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteNIF, setClienteNIF] = useState("");
  const [importeTotal, setImporteTotal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [rectificando, setRectificando] = useState(false);

  // anulación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [facturaAAnular, setFacturaAAnular] = useState(null);
  const [anulandoId, setAnulandoId] = useState(null);

  // debounce búsqueda
  const [debouncedBusqueda, setDebouncedBusqueda] = useState(busqueda);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusqueda(busqueda), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // reset página al cambiar filtros
  useEffect(() => {
    setPagina(1);
  }, [filtroAnio, debouncedBusqueda, fechaInicio, fechaFin, estado, includeAnulaciones, filtroTipoCliente]);

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
  // Helpers UI
  // ============================
  const showOk = useCallback((mensaje) => {
    setMensajeAlerta({ tipo: "exito", mensaje });
  }, []);

  const showWarn = useCallback((mensaje) => {
    setMensajeAlerta({ tipo: "error", mensaje });
  }, []);

  const showErr = useCallback((err, fallbackMessage = "No se pudo completar la operación.") => {
    const normalized = normalizeApiError(err);
    // Si no viene message por cualquier motivo, usamos fallback
    setErrorToast({
      ...normalized,
      message: normalized?.message || fallbackMessage,
    });
  }, []);

  // ============================
  // Cargar facturas (server-side)
  // ============================
  const abortRef = useRef(null);

  const cargarFacturas = useCallback(async () => {
    try {
      setLoadingList(true);
      setErrorToast(null);

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const { data } = await api.get(`/facturas/facturas-encadenadas?${queryString}`, {
        signal: controller.signal,
      });

      setFacturas(data?.facturas || []);
      setTotalPaginas(data?.totalPaginas || 1);
      setTotalFacturas(data?.totalFacturas || 0);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      logger.error("facturas.list.error", err);
      showErr(err, "No se pudieron cargar las facturas.");
    } finally {
      setLoadingList(false);
    }
  }, [queryString, showErr]);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  // ============================
  // Rectificación
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
    setClienteNombre(factura?.clienteNombre || "");
    setClienteNIF(factura?.clienteNIF || "");
    setImporteTotal(typeof factura?.importeTotal === "number" ? String(factura.importeTotal) : "");
    setMotivo("");
    setTipo("");
    setSubtipo("");
    setMostrarModal(true);
  };

  const confirmarRectificacion = async () => {
    if (!facturaSeleccionada?._id) return;

    const imp = Number(importeTotal);

    // validación mínima: esto es UI (AlertaMensaje)
    if (!tipo) return showWarn("Selecciona un tipo (R1–R5).");
    if (["R1", "R2"].includes(tipo) && !subtipo) {
      return showWarn("Selecciona subtipo (S/I) para R1 o R2.");
    }
    if (!Number.isFinite(imp) || imp === 0) {
      return showWarn("Importe inválido (debe ser distinto de 0).");
    }
    if (motivo && motivo.length > 500) {
      return showWarn("Motivo demasiado largo (máx 500).");
    }

    try {
      setRectificando(true);
      setErrorToast(null);

      const { data } = await api.post(`/facturas/rectificar/${facturaSeleccionada._id}`, {
        tipoFactura: tipo,
        tipoRectificativa: ["R1", "R2"].includes(tipo) ? subtipo : undefined,
        clienteNombre,
        clienteNIF,
        importeTotal: imp,
        motivo,
      });

      const num = data?.facturaRectificativa?.numeroFactura;
      showOk(`Factura rectificativa emitida correctamente${num ? `: Nº ${num}` : ""}.`);

      setMostrarModal(false);
      resetRectificacionForm();
      await cargarFacturas();
    } catch (err) {
      logger.error("facturas.rectificar.error", err);
      showErr(err, "Hubo un problema al rectificar la factura.");
    } finally {
      setRectificando(false);
    }
  };

  // ============================
  // Anulación
  // ============================
  const solicitarAnulacion = (factura) => {
    setFacturaAAnular(factura);
    setMostrarConfirmacion(true);
  };

  const ejecutarAnulacion = async () => {
    if (!facturaAAnular?._id) return;

    try {
      setAnulandoId(facturaAAnular._id);
      setErrorToast(null);

      const { data } = await api.post(`/facturas/anular/${facturaAAnular._id}`, { motivo: "" });

      showOk(
        data?.already
          ? `La factura ya estaba anulada: Nº ${data?.numeroFactura || ""}`
          : `Factura anulada correctamente: Nº ${data?.numeroFactura || ""}`
      );

      setMostrarConfirmacion(false);
      setFacturaAAnular(null);
      await cargarFacturas();
    } catch (err) {
      logger.error("facturas.anular.error", err);
      showErr(err, "No se pudo anular la factura.");
    } finally {
      setAnulandoId(null);
    }
  };

  // ============================
  // Exportaciones
  // ============================
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // P3-1: Descargar PDF individual de una factura
  const [descargandoPdfId, setDescargandoPdfId] = useState(null);
  const descargarPDFFactura = async (factura) => {
    if (!factura?._id) return;
    try {
      setDescargandoPdfId(factura._id);
      setErrorToast(null);
      const { data } = await api.get(`/facturas/pdf/${factura._id}`, { responseType: "blob" });
      downloadBlob(
        new Blob([data], { type: "application/pdf" }),
        `factura_${factura.numeroFactura || factura._id}.pdf`
      );
    } catch (err) {
      logger.error("facturas.download.pdf.error", err);
      showErr(err, "No se pudo descargar el PDF de la factura.");
    } finally {
      setDescargandoPdfId(null);
    }
  };

  const exportarCSV = async () => {
    try {
      setExportLoading(true);
      setErrorToast(null);

      const { data } = await api.get(`/facturas/exportar-csv?${exportQueryString}`, {
        responseType: "blob",
      });

      downloadBlob(new Blob([data], { type: "text/csv;charset=utf-8;" }), `facturas_${Date.now()}.csv`);
      showOk("CSV exportado correctamente.");
    } catch (err) {
      logger.error("facturas.export.csv.error", err);
      showErr(err, "No se pudo exportar el CSV.");
    } finally {
      setExportLoading(false);
    }
  };

  const exportarPDF = async () => {
    try {
      setExportLoading(true);
      setErrorToast(null);

      const { data: csvBlob } = await api.get(`/facturas/exportar-csv?${exportQueryString}`, {
        responseType: "blob",
      });

      const csvText = await csvBlob.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const rows = Array.isArray(parsed?.data) ? parsed.data : [];

      if (!rows.length) {
        showWarn("No hay facturas para exportar a PDF.");
        return;
      }

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
      showOk("PDF exportado correctamente.");
    } catch (err) {
      logger.error("facturas.export.pdf.error", err);
      showErr(err, "No se pudo exportar el PDF (revisa filtros o tamaño).");
    } finally {
      setExportLoading(false);
    }
  };

  // ============================
  // Ver XML / AEAT
  // ============================
  const esXMLRaw = (s) => {
    const t = String(s || "").trim();
    return t.startsWith("<") || t.startsWith("<?xml");
  };

  const decodeMaybeBase64 = (s) => {
    const t = String(s || "");
    if (!t) return "";
    if (esXMLRaw(t)) return t;
    try {
      return atob(t);
    } catch {
      return t;
    }
  };

  const verXML = (xmlStored) => {
    if (!xmlStored) return showWarn("Esta factura no contiene XML firmado.");

    try {
      const xml = decodeMaybeBase64(xmlStored);
      const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      showWarn("No se pudo abrir el XML.");
    }
  };

  const verRespuestaAEAT = (respuesta) => {
    if (!respuesta) return showWarn("Esta factura no tiene respuesta de la AEAT.");

    try {
      const pretty = typeof respuesta === "string" ? respuesta : JSON.stringify(respuesta, null, 2);
      const blob = new Blob([pretty], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      showWarn("No se pudo mostrar la respuesta de la AEAT.");
    }
  };

  // Filtro cliente-side: consumidor final vs nominativa
  const facturasFiltradas = useMemo(() => {
    if (!filtroTipoCliente) return facturas;
    return facturas.filter((f) => {
      const tieneNIF = !!f.clienteNIF && f.clienteNIF.trim() !== "";
      if (filtroTipoCliente === "nominativa") return tieneNIF;
      if (filtroTipoCliente === "consumidor_final") return !tieneNIF;
      return true;
    });
  }, [facturas, filtroTipoCliente]);

  const limpiarFiltros = () => {
    setFiltroAnio("");
    setBusqueda("");
    setFechaInicio("");
    setFechaFin("");
    setEstado("");
    setIncludeAnulaciones(false);
    setFiltroTipoCliente("");
  };

  // retry handler global (para el toast)
  const onRetry = useCallback(() => {
    // Elegimos el retry “más útil”: si está cargando lista => recargar.
    // Si estabas exportando/rectificando/anulando, lo normal es reintentar manualmente,
    // pero este retry vuelve a intentar cargar el listado (lo más seguro).
    cargarFacturas();
  }, [cargarFacturas]);

  // ============================
  // Render
  // ============================
  return (
    <main className="facturaspage section section--wide">
      {/* ERROR TOAST (KO) */}
      {errorToast && (
        <ErrorToast
          error={errorToast}
          onRetry={errorToast.canRetry ? onRetry : undefined}
          onClose={() => setErrorToast(null)}
        />
      )}

      {/* HEADER */}
      <header className="facturaspage-header">
        <div className="facturaspage-header-row">
          <div>
            <h1>📄 Facturas Encadenadas</h1>
            <p>Consulta, exporta y gestiona tu historial fiscal.</p>

            <div className="facturaspage-meta">
              <span>{loadingList ? "Cargando…" : `Total: ${totalFacturas}`}</span>
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
          <p className="facturaspage-card-subtitle">Filtra por fechas, año, estado, cliente o hash.</p>
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
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>

          <div className="config-field">
            <label>Hasta</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>

          <div className="config-field">
            <label>Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              {ESTADO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
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

          <div className="config-field">
            <label>Tipo de factura</label>
            <select value={filtroTipoCliente} onChange={(e) => setFiltroTipoCliente(e.target.value)}>
              <option value="">Todas</option>
              <option value="consumidor_final">Consumidor final</option>
              <option value="nominativa">Nominativa</option>
            </select>
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
            <button className="btn" type="button" onClick={limpiarFiltros} disabled={loadingList || exportLoading}>
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
        <button className="btn btn-primario" onClick={exportarPDF} disabled={exportLoading}>
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
              {!loadingList && facturasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 18, textAlign: "center" }}>
                    No hay facturas con estos filtros.
                  </td>
                </tr>
              )}

              {facturasFiltradas.map((f) => (
                <tr key={f._id}>
                  <td>
                    <span className={`estado-factura ${String(f.estado || "").toLowerCase()}`}>
                      {ESTADO_LABEL[String(f.estado || "").toLowerCase()] || f.estado}
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

                      <button
                        onClick={() => descargarPDFFactura(f)}
                        disabled={descargandoPdfId === f._id}
                        title="Descargar PDF"
                      >
                        {descargandoPdfId === f._id ? "⏳" : "📥 PDF"}
                      </button>

                      <button onClick={() => verXML(f.xmlFirmado)} disabled={!f.xmlFirmado}>
                        📄 XML
                      </button>

                      {f.respuestaAEAT ? (
                        <button onClick={() => verRespuestaAEAT(f.respuestaAEAT)}>🏛 AEAT</button>
                      ) : (
                        <button disabled title="Sin respuesta AEAT">🏛 AEAT</button>
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
        {facturasFiltradas.map((f) => (
          <div key={f._id} className="factura-card">
            <div className="factura-card-header">
              <span className={`estado-factura ${String(f.estado || "").toLowerCase()}`}>
                {f.estado}
              </span>
              <strong>{f.numeroFactura}</strong>
            </div>

            <div className="factura-card-body">
              <div>
                <strong>Fecha:</strong> {new Date(f.fechaExpedicion).toLocaleDateString("es-ES")}
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

              <button
                onClick={() => descargarPDFFactura(f)}
                disabled={descargandoPdfId === f._id}
              >
                {descargandoPdfId === f._id ? "⏳" : "📥 PDF"}
              </button>

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
        <div className="modal-overlay_facturaspage" onClick={() => { if (!rectificando) { setMostrarModal(false); setFacturaSeleccionada(null); resetRectificacionForm(); } }}>
          <div className="modal-contenido_facturaspage" onClick={(e) => e.stopPropagation()}>
            <div className="rectModal-header">
              <div>
                <h2>Rectificar factura</h2>
                <p className="rectModal-sub">
                  Factura original: <strong>{facturaSeleccionada?.numeroFactura}</strong>
                  {facturaSeleccionada?.importeTotal != null && (
                    <> — {Number(facturaSeleccionada.importeTotal).toFixed(2)} €</>
                  )}
                </p>
              </div>
              <button
                type="button"
                className="rectModal-close"
                onClick={() => { setMostrarModal(false); setFacturaSeleccionada(null); resetRectificacionForm(); }}
                disabled={rectificando}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="rectModal-section">
              <p className="rectModal-section-title">Tipo de rectificación</p>
              <div className="config-field">
                <label>Tipo *</label>
                <select value={tipo} onChange={(e) => { setTipo(e.target.value); setSubtipo(""); }}>
                  <option value="">Selecciona tipo…</option>
                  {TIPO_RECTIFICATIVA.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {TIPO_RECTIFICATIVA.find((t) => t.value === tipo)?.needsSubtipo && (
                <div className="config-field">
                  <label>Subtipo *</label>
                  <select value={subtipo} onChange={(e) => setSubtipo(e.target.value)}>
                    <option value="">Selecciona subtipo…</option>
                    <option value="S">S — Por sustitución (reemplaza la factura original)</option>
                    <option value="I">I — Por diferencias (corrige el importe)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="rectModal-section">
              <p className="rectModal-section-title">Datos del cliente</p>
              <div className="rectModal-grid">
                <div className="config-field">
                  <label>Nombre</label>
                  <input
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Nombre o razón social"
                  />
                </div>
                <div className="config-field">
                  <label>NIF / CIF</label>
                  <input
                    value={clienteNIF}
                    onChange={(e) => setClienteNIF(e.target.value)}
                    placeholder="12345678A"
                  />
                </div>
              </div>
            </div>

            <div className="rectModal-section">
              <p className="rectModal-section-title">Importe y motivo</p>
              <div className="rectModal-grid">
                <div className="config-field">
                  <label>Importe total (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={importeTotal}
                    onChange={(e) => setImporteTotal(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="config-field">
                  <label>Motivo</label>
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Describe el motivo de la rectificación…"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="modal-botones_facturaspage">
              <button
                onClick={() => { setMostrarModal(false); setFacturaSeleccionada(null); resetRectificacionForm(); }}
                disabled={rectificando}
              >
                Cancelar
              </button>

              <button
                className="btn btn-primario"
                onClick={confirmarRectificacion}
                disabled={
                  rectificando ||
                  !tipo ||
                  (TIPO_RECTIFICATIVA.find((t) => t.value === tipo)?.needsSubtipo && !subtipo) ||
                  !Number.isFinite(Number(importeTotal)) ||
                  Number(importeTotal) === 0
                }
              >
                {rectificando ? "Emitiendo rectificativa…" : "Emitir factura rectificativa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTA OK / VALIDACIONES */}
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